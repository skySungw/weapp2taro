const PARAMS = {
    EXPRESSION_STATEMENT: 'ExpressionStatement',
    CALL_EXPRESSION: 'CallExpression',
    OBJECT_EXPRESSION: 'ObjectExpression',
    FUNCTION_EXPRESS: "FunctionExpression",
    BLOCK_STATEMENT: "BlockStatement",
    RETURN_STATEMENT: "ReturnStatement"
}
const PROPERTY = {
    PROPERTY: 'Property'
}
// 小程序Page里的属性
const WEAPP = {
    PAGE: 'Page',
    DATA: 'data',
    ON_LOAD: 'onLoad',
    ON_SHOW: 'onShow',
    ON_HIDE: 'onHide',
    ON_RESIZE: 'onResize'
}
// 小程序Component里属性
const COMPONENT = {
    COMPONENT: 'Component',// 组件内解析
    PAGE_LIEFTIMES: 'pageLifetimes',// 小程序组件生命周期
    SHOW: 'show',
    HIDE: 'hide',
    RESIZE: 'resize',
    PROPERTIES: 'properties',
    PROPERTIES_VALUE: 'value',
    OBSERVER: 'observer',
    OBSERVERS: 'observers',
    WATCH: 'watch'
}
// 以下是组件内生命周期,只需要改名字的
const ONLY_CHANGE_PROPERTY_NAME = {
    // CREATED: 'created', 
    attached: 'mounted',
    ready: 'onReady',
    moved: 'moved',
    detached: 'destroyed',
    error: 'onError',
    observers: 'watch',
    value: 'default',
    properties: 'props'
}
// Components properties转换
const COMPONENT_PROPERTIES = {

}
export {
    PARAMS,
    PROPERTY,
    WEAPP,
    COMPONENT,
    ONLY_CHANGE_PROPERTY_NAME
};