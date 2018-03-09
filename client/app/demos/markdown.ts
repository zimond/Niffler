export enum Symbol {
    Backtick = '`',
    Asterisk = '*',
    Underscore = '_',
    DoubleAsterisk = '**',
    DoubleUnderscore = '__',
    TrippleBacktick = '```'
}

export namespace Symbol {
    export function keyToSymbol(key: string): Symbol {
        for (let k in Symbol) {
            if (Symbol[k] === key) {
                return Symbol[k] as Symbol;
            }
        }
        return undefined;
    }
}

export enum BlockType {
    Emphasis,
    Italic,
    Quote,
    CodeInline,
    CodeBlock,
    Normal,
    Abstract,
    Break
}

export namespace BlockType {
    const LEAF_TYPES = [ BlockType.Normal, BlockType.CodeInline ];
    export function leafTypes(): BlockType[] {
        return LEAF_TYPES;
    }
    export function fromSymbol(s: Symbol): BlockType {
        switch (s) {
            case Symbol.Asterisk:
            case Symbol.Underscore:
                return BlockType.Italic;
            case Symbol.Backtick:
                return BlockType.CodeInline;
            case Symbol.DoubleAsterisk:
            case Symbol.DoubleUnderscore:
                return BlockType.Emphasis;
            default:
                return BlockType.Normal;
        }
    }
}

/**
 * BlockNode represents a data block in
 * a document. (like an emphasis block).
 *
 * Many nodes build up an ordered symbol
 * tree.
 */
export class BlockNode {
    // the string included in this node
    data: string;
    symbol: Symbol;
    // the type of this node
    type: BlockType;
    parent: BlockNode;
    nextSibling: BlockNode;
    prevSibling: BlockNode;
    children: BlockNode[];
    dom: Element;
    // if this node or its children has changed
    // used for react
    changed: Boolean;
    // if this node could accept more data
    open: boolean;
    constructor(type: BlockType) {
        this.type = type;
        this.data = '';
        this.parent = this.nextSibling = this.prevSibling = undefined;
        this.children = [];
        this.open = true;
    }
    isLeaf(): boolean {
        return BlockType.leafTypes().indexOf(this.type) !== -1;
    }
    isRoot(): boolean {
        return !this.parent;
    }
    private markChanged() {
        let n = this as BlockNode;
        while (n) {
            n.changed = true;
            n = n.parent;
        }
    }
    removeChild(node: BlockNode) {
        let index = this.children.indexOf(node);
        if (index !== -1) {
            this.children.splice(index, 1);
            if (node.prevSibling) {
                node.prevSibling.nextSibling = node.nextSibling;
            }
            if (node.nextSibling) {
                node.nextSibling.prevSibling = node.prevSibling;
            }
        }
        this.markChanged();
    }
    /**
     * Append a child node to this node
     * @param node the node to be appent
     */
    appendChild(node: BlockNode): void {
        this.children.push(node);
        node.parent = this;
        if (this.children.length > 1) {
            let prev = this.children[this.children.length - 1];
            prev.nextSibling = node;
            node.prevSibling = prev;
        }
        this.markChanged();
    }
    /**
     * Insert a node after `prev`
     *
     * @param prev the anchor node
     * @param node the node to be inserted
     */
    insertAfter(prev: BlockNode | undefined, node: BlockNode) {
        let index = this.children.indexOf(prev);
        if (index === -1 && prev) return;
        this.children.splice(index + 1, 0, node);
        node.prevSibling = prev;
        node.parent = this;
        if (prev) {
            if (prev.nextSibling) prev.nextSibling.prevSibling = node;
            node.nextSibling = prev.nextSibling;
            prev.nextSibling = node;
        } else if (this.children.length > 1) {
            node.nextSibling = this.children[1];
            this.children[1].prevSibling = node;
        }
        this.markChanged();
    }
    /**
     * Add some data to this node. This function will potentially change
     * `DocumentTree.currentNode`. The changed current node is returned.
     *
     * @param data the data to be added
     * @param parseSpecialSymbols flag is special symbols in the data should be parsed
     * @returns The new `DocumentTree.currentNode` instance
     */
    addData(data: string, parseSpecialSymbols = true): BlockNode {
        if (parseSpecialSymbols) {
            for (let i = 0; i < data.length; i++) {
                let c = data[i];
                // this char is a special symbol
                let symbol = Symbol.keyToSymbol(c);
                if (symbol) {
                    // already contains a symbol
                    if (this.data.includes(c)) {
                        let seperated = this.data.split(c);
                        this.data = seperated[0];
                        let newNode = new BlockNode(BlockType.fromSymbol(symbol));
                        this.parent.insertAfter(this, newNode);
                        newNode.addData(seperated[1] + data.slice(0, i), false);
                        newNode.symbol = symbol;
                        newNode.open = false;
                        let newNormal = new BlockNode(BlockType.Normal);
                        this.parent.insertAfter(newNode, newNormal);
                        newNormal.addData(data.slice(i + 1), true);
                        if (!this.data) this.parent.removeChild(this);
                        return newNormal;
                    }
                    // or we just do nothing
                }
                this.data += c;
            }
        } else {
            this.data += data;
        }
        return this;
    }
}

/**
 * DocumentTree is an ordered tree
 * representing the whole document.
 */
export class DocumentTree {
    // the root node of the tree, must
    // be of type `BlockType.Abstract`
    root: BlockNode;
    // current selected node
    currentNode: BlockNode;
    constructor() {
        this.root = new BlockNode(BlockType.Abstract);
        this.currentNode = this.root;
    }
    addContent(content: string) {
        // TODO: use special characters to split the content
        while (!this.currentNode.open && !this.currentNode.isRoot()) {
            this.currentNode = this.currentNode.parent;
        }
        if (this.currentNode.isLeaf()) {
            this.currentNode = this.currentNode.addData(content);
        } else {
            let node = new BlockNode(BlockType.Normal);
            this.currentNode.appendChild(node);
            this.currentNode = node;
            node.addData(content);
        }
    }
}
