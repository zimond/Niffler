import * as React from 'react';
import * as ReactDOM from 'react-dom';

export class Todo extends React.Component<{}, {}> {
    render() {
        return <div>
            <div className='niffler-input-result-wrapper'></div>
            <input type='text' className='niffler-input'/>
        </div>
    }
}

ReactDOM.render(<Todo/>, document.getElementById('main'));