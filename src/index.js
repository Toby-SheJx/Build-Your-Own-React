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
let wipRoot = null;         // work in progress root
let currentRoot = null;     // root commit in last phase
let deletions = null;       // track delete fiber node

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
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    },
    alternate: currentRoot
  };

  nextUnitOfWork = wipRoot;
  deletions = [];
}

const Teact = { createElement, render, useState };

/** @jsxRuntime classic */
/** @jsx Teact.createElement */
// const container = document.getElementById("root");
// const element = (
//   <div>
//     <div style="color: red;" id="box" onClick={() => console.warn(" initial ")}>
//       <a>Hello React</a>
//       <b />
//     </div>
//   </div>
// );
// Teact.render(element, container);

// setTimeout(() => {
//   Teact.render((
//     <h1>Hello React !!!</h1>
//   ), container);
// }, 2000);

/** 函数式组件 */
/** @jsxRuntime classic */
/** @jsx Teact.createElement */
function App(props) {
  const [count, setCount] = Teact.useState(0);
  const [showName, setShowName] = Teact.useState(true);

  return (
    <div id="1" onClick={() => {
      setCount(prevState => prevState + 1);
      setShowName(prevState => !prevState);
    }}>
      <h1>Hi {showName ? props.name : ""} {count}</h1>
    </div>
  );
}

const element = <App name="Toby" />;
const container = document.getElementById("root");
Teact.render(element, container);

// setTimeout(() => {
//   function AppUpdate() {
//     return (
//       <div id="2" onClick={() => console.warn(" click ")}>
//         <h1>Hi! </h1>
//       </div>
//     );
//   }

//   Teact.render(<AppUpdate />, container);
// }, 2000);

/** Character.3 并行模式（分割工作片段） */
function workLoop(deadLine) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);

    shouldYield = deadLine.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function commitRoot() {
  deletions.map(item => commitWork(item));
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) return;

  // const domParent = fiber.parent.dom;
  
  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    updateListener(fiber.dom, fiber.props);
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "DELETION") {
    // 要删除的元素不在当前要渲染DOM结构中，而是在上一次渲染的DOM结构中。
    // 但当前渲染是基于上一次渲染的，所以我们要通过上一次渲染的DOM结构将其进行删除。
    // domParent.removeChild(fiber.dom);

    commitDeletion(fiber, domParent);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }

  if (fiber.effectTag === "DELETION" && fiber.type instanceof Function) return;

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}

function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
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

let wipFiber = null;
let hookIndex = null;
function updateFunctionComponent(fiber) {
  // 初始化hooks相关全局变量，将其挂载在函数式组件Fiber节点上
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];

  // 创建当前元素的子级Fiber节点们，构建Fiber Tree
  // 函数式组件的子级节点通过运行函数获取
  const elements = [fiber.type(fiber.props)];
  reconcileChildren(fiber, elements);
}

function useState(initial) {
  const oldHook = wipFiber.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex];
  const hook = { state: oldHook ? oldHook.state : initial, queue: [] };

  const actions = oldHook ? oldHook.queue : [];
  actions.map(action => {
    hook.state = action(hook.state);
  });

  const setState = action => {
    hook.queue.push(action);
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  }

  wipFiber.hooks.push(hook);
  hookIndex++;

  return [hook.state, setState];
}

function updateHostComponent(fiber) {
  // 创建真实DOM节点
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  // if (fiber.parent) {
  //   fiber.parent.dom.appendChild(fiber.dom);
  // }

  // 创建当前元素的子级Fiber节点们，构建Fiber Tree
  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);
}

function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let prevSibling = null;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;

  while (index < elements.length || (oldFiber !== null && oldFiber !== undefined)) {
    const element = elements[index];

    let newFiber = null;

    // 当前要渲染的element与上一次commit的Fiber Tree节点进行比较
    const sameType = oldFiber && element && element.type === oldFiber.type;

    if (sameType) { // update
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE"
      }
    }
    if (element && !sameType) { // add
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT"
      }
    }
    if (oldFiber && !sameType) { // delete
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    // const newFiber = {
    //   type: element.type,
    //   props: element.props,
    //   parent: wipFiber,
    //   dom: null
    // }

    // 设置指向子节点和兄弟节点的指针
    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
}

const isEvent = key => key.startsWith("on");
const isProperty = key => key !== "children" && !isEvent(key);
const isNew = (prev, next) => key => prev[key] !== next[key];
const isGone = next => key => !(key in next);
function updateDom(dom, prevProps, nextProps) {
  // 移除变更的监听事件
  Object.keys(prevProps).filter(isEvent).filter(key => isGone(nextProps)(key) || isNew(prevProps, nextProps)(key)).map(name => {
    const eventType = name.toLowerCase().substring(2);
    dom.removeEventListener(eventType, prevProps[name]);
  });

  // 添加新增或变更的监听事件
  Object.keys(nextProps).filter(isEvent).filter(isNew(prevProps, nextProps)).map(name => {
    const eventType = name.toLowerCase().substring(2);
    dom.addEventListener(eventType, nextProps[name]);
  });

  // 移除变更的props
  Object.keys(prevProps).filter(isProperty).filter(isGone(nextProps)).map(name => dom[name] = "");

  // 添加新增或变化的props
  Object.keys(nextProps).filter(isProperty).filter(isNew(prevProps, nextProps)).map(name => dom[name] = nextProps[name]);
}

function updateListener(dom, props) {
  // 添加监听事件
  Object.keys(props).filter(isEvent).map(name => {
    const eventType = name.toLowerCase().substring(2);
    dom.addEventListener(eventType, props[name]);
  });
}
