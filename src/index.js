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

/** 在 Character 4 中重构 */
// function render(element, container) {
//   const dom = element.type === "TEXT_ELEMENT" ? 
//     document.createTextNode(element.props.nodeValue) : 
//     document.createElement(element.type);

//   const isProperty = key => key !== "children";
//   Object.keys(element.props).filter(isProperty).map(name => {
//     dom[name] = element.props[name];
//   });

//   element.props.children.map(child => render(child, dom));

//   container.appendChild(dom);
// }

let nextUnitOfWork = null;

function createDom(fiber) {
  const dom = fiber.type === "TEXT_ELEMENT" ? 
    document.createTextNode("") : 
    document.createElement(fiber.type);

  const isProperty = key => key !== "children";
  Object.keys(fiber.props).filter(isProperty).map(name => {
    dom[name] = fiber.props[name];
  });

  return dom;
}

/** 初始化 nextUnitOfWork，即Fiber Tree根节点的Fiber */
function render(element, container) {
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element]
    }
  }
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


/** Character.3 并行模式（分割工作片段） */
function workLoop(deadLine) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);

    shouldYield = deadLine.timeRemaining() < 1;
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performUnitOfWork(fiber) {
  // 将元素添加到真实DOM结构中
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom);
  }

  // 创建当前元素的子级Fiber节点们，构建Fiber Tree
  const elements = fiber.props.children;
  let index = 0;
  let prevSibling = null;

  while (index < elements.length) {
    const element = elements[index];

    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null
    }

    // 设置指向子节点和兄弟节点的指针
    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }

  // 返回下一个渲染工作片段
  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }

    nextFiber = nextFiber.parent;
  }
}
