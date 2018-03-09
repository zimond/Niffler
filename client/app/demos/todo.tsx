import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BlockNode, DocumentTree, BlockType, Symbol } from './markdown';

interface Editable {
    editing: boolean
}

interface TodoState extends Editable {
    data: string
}

class TodoChildren {
    type: BlockType;
    value: string;
}

export class Todo extends React.Component<{}, TodoState> {
    wrapper: HTMLElement;
    symbolsStack: Array<Symbol>;
    tree: DocumentTree;
    constructor(props: React.Props<{}>) {
        super(props, {});
        this.onKeyPress = this.onKeyPress.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onBlur = this.onBlur.bind(this);
        this.state = {
            editing: false,
            data: ''
        };
        this.symbolsStack = [];
        this.tree = new DocumentTree();
    }
    render() {
        let children = this.tree.root.children.map((node, index) => {
            return this.renderNode(node, index);
        });
        return <div
            id='editor-demo'
            suppressContentEditableWarning
            ref={(d) => this.wrapper = d}
            style={{height: '100%'}}
            contentEditable={this.state.editing}
            onKeyPress={this.onKeyPress}
            onKeyDown={this.onKeyDown}
            onClick={this.onClick}
            data-placeholder='type somehing'
            onBlur = {this.onBlur}>
        {children}
        </div>
    }
    onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        let c = this.tree.currentNode;
        console.log(e.keyCode);
        let shouldPreventDefault = false;
        switch (e.keyCode) {
            case 8: { // Backspace
                c.data = c.data.substring(0, c.data.length - 1);
                this.setState({ data: this.state.data.substring(0, this.state.data.length - 1)});
                shouldPreventDefault = true;
                break;
            }
            case 13: {// Enter
                shouldPreventDefault = true;
                this.setState({ data: this.state.data + '\n\n'});
                let brNode = new BlockNode(BlockType.Break);
                brNode.open = false;
                c.parent.insertAfter(c, brNode);
                let newNode = new BlockNode(BlockType.Normal);
                c.parent.insertAfter(brNode, newNode);
                this.tree.currentNode = newNode;
                break;
            }
        }
        if (shouldPreventDefault) {
            e.preventDefault();
            this.rebuildCaret();
        }
    }
    onKeyPress(e: React.KeyboardEvent<HTMLDivElement>) {
        this.setState({ data: this.state.data + e.nativeEvent.key });
        this.tree.addContent(e.nativeEvent.key);
        let key = Symbol.keyToSymbol(e.nativeEvent.key);
        if (key) {
            this.symbolsStack.push(key);
        }
        e.preventDefault();
        this.rebuildCaret();
    }
    onClick() {
        this.setState({ editing: true }, () => {
            this.wrapper.focus();
        });
    }
    onBlur() {
        this.setState({ editing: false });
    }
    private rebuildCaret() {
        // remove cursor
        setTimeout(() => {
            let selection = window.getSelection();
            let range = document.createRange();
            console.log(this.tree.currentNode.dom.childNodes);
            let textNode = this.tree.currentNode.dom.childNodes[0] || this.tree.currentNode.dom;
            range.setStart(textNode, this.tree.currentNode.data.length);
            range.setEnd(textNode, this.tree.currentNode.data.length);
            selection.removeAllRanges();
            selection.addRange(range);
        });
    }
    private renderNode(node: BlockNode, key: number) {
        let tag = 'span';
        if (node.type === BlockType.Italic) tag = 'i';
        else if (node.type === BlockType.Emphasis) tag = 'b';
        else if (node.type === BlockType.Break) tag = 'br';
        return React.createElement(tag, {
            key,
            ref: (e) => node.dom = e,
            'data-decorator': node.symbol,
            'data-placeholder': 'ss'
        }, tag === 'br' ? undefined : node.data);
    }
}

ReactDOM.render(<Todo/>, document.getElementById('main'));