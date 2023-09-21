import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

/**
 * Source: https://pomb.us/build-your-own-react/
 */

/**
 * Character.0 Review
 */

/** Step.0 初始 */
// const container = document.getElementById('root');
// const element = (
//   <h1 className='label'>Hello React</h1>
// )
// ReactDOM.render(element, container);

/** Step.1 createElement */
// const container = document.getElementById('root');
// const element = React.createElement('h1', { className: 'label' }, 'Hello React');
// ReactDOM.render(element, container);

/** Step.2 完全替代React实现相同效果 */
// const container = document.getElementById('root');

// const element = {
//   type: 'h1',
//   props: {
//     className: 'label',
//     children: 'Hello React'
//   }
// }

// const node = document.createElement(element.type);
// node['className'] = 'label';

// const text = document.createTextNode(element.props.children);
// text['nodeValue'] = element.props.children;

// node.appendChild(text);
// container.appendChild(node);



/**
 * Character.1 The createElement Function
 */

/** Step.0 初始 */
// const container = document.getElementById("root");
// const element = (
//   <div id="box">
//     <a>Hello React</a>
//     <b />
//   </div>
// );
// console.warn(" element ", element);
// ReactDOM.render(element, container);

/** Step.1 createElement */
// const container = document.getElementById("root");
// const element = React.createElement(
//   "div",
//   { id: "box" },
//   React.createElement("a", null, "Hello React"),
//   React.createElement("b")
// )
// ReactDOM.render(element, container);

/** Step.2 实现 */
function createElement(type, props, ...children) {
  console.warn(" run Teact.createElement ");
  return {
    type,
    props: {
      ...props,
      children: children.map(child => 
        typeof child === "object" ? child : createTextElement(child)
      )
    }
  }
}

function createTextElement(value) {
  return {
    type: "TEXT_ELEMENT",
    props: { nodeValue: value, children: [] }
  }
}

function render(element, container) {
  const dom = element.type === "TEXT_ELEMENT" ? 
    document.createTextNode(element.props.nodeValue) : 
    document.createElement(element.type);

  const isProperty = key => key !== "children";
  Object.keys(element.props).filter(isProperty).map(name => {
    dom[name] = element.props[name];
  });

  element.props.children.map(child => render(child, dom));

  container.appendChild(dom);
}

const Teact = { createElement, render };

/** @jsxRuntime classic */
/** @jsx Teact.createElement */
const container = document.getElementById("root");
const element = (
  <div style="color: red;" id="box">
    <a>Hello React</a>
    <b />
  </div>
);
Teact.render(element, container);
// ReactDOM.render(element, container);
