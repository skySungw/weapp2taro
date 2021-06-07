import { PARAMS, PROPERTY, WEAPP, COMPONENT, ONLY_CHANGE_PROPERTY_NAME } from '../config/Category.js';
const recast = require('recast');
const { exportDefaultDeclaration, emptyStatement, property, returnStatement, functionExpression,visitArrowFunctionExpression, blockStatement, objectExpression } = recast.types.builders
const convertDataProperty = (data) => {
    return data;
}

// 通用方法，只改变Property名字


// 能用方法结束

// Component 组件内转Taro方法 开始

// Component()方法  转 taro export default {}
const convertComponentMethod = ast => {
    const n = exportDefaultDeclaration(
        ast.expression.arguments[0]
    );
    return n;
}
// 属性转换 properties 转 taro props 以及 watch对象
const convertPropertiesMethods = propertiesObj => {
    // 将属性中的observer 返回给 component 中的 watch
    let watchArr = [];
    // console.log("propertiesObj", propertiesObj);
    const propertiesArr = propertiesObj.value.properties;
    // 遍历 component下 properties 所有属性
    propertiesArr.forEach((v, i) => {
        let itemName = v.key.name;
        let type = v.value.type;
        let itemArr = [];
        // 如果 properties 是对象属性，则需要处理
        if (type == PARAMS.OBJECT_EXPRESSION) {
            itemArr = v.value.properties;
            // console.log("itemArr", itemArr);
            // 遍历 properties下，对象属性的对象
            itemArr.forEach((item, k) => {
                if (item.key.name == COMPONENT.PROPERTIES_VALUE) {
                    v.value.properties[k].key.name = ONLY_CHANGE_PROPERTY_NAME[COMPONENT.PROPERTIES_VALUE];
                } else if (item.key.name == COMPONENT.OBSERVER) {
                    item.key.name = itemName;
                    watchArr.push(item);
                    // 删除 observer属性
                    v.value.properties.splice(k, 1);
                }
            })
        }
        // console.log("itemName", itemName);
    });
    // propertiesObj.key.name = ONLY_CHANGE_PROPERTY_NAME[propertiesObj.key.name]
    return {
        watchArr
    };
}
// lifetimes里hide、show、resize改名
const convertLifetimesMethods = lifeTimesArr => {
    let newLifeTimesArr = [];
    lifeTimesArr.forEach(v => {
        let name = '';
        switch(v.key.name) {
            case COMPONENT.SHOW:
                name = WEAPP.ON_SHOW;
                break;
            case COMPONENT.HIDE:
                name = WEAPP.ON_HIDE;
                break;
            case COMPONENT.RESIZE:
                name = WEAPP.ON_RESIZE;
                break;
        }
        v.key.name = name;
        newLifeTimesArr.push(v);
    })
    return newLifeTimesArr;
}

// lifetimes 转Taro内vue生命周期
const convertLifeTimes = (ast, lifeTimesItem) => {
    const lifeTimesArr = lifeTimesItem.value.properties;
    lifeTimesArr.forEach(v => {
        v = objectExpression([v])
    });
    const afterConvertLifetimes = convertLifetimesMethods(lifeTimesArr);
    let componentArguments = ast.expression.arguments;
    let current = 0;
    // 遍历，删除 lifetimes对象
    for(let i = 0; i< componentArguments.length; i++) {
        let argumentList = componentArguments[i].properties;
        for(let j =0; j< argumentList.length; j++) {
            let propertyItem = argumentList[j];
            if (propertyItem.key.name == COMPONENT.PAGE_LIEFTIMES) {
                current = j;
                // ast.expression.arguments[i].properties.splice(i, 1);
                break;
            }
        }
    }
    // 将lifetimes下对象，转给Component 对象
    // ast.expression.arguments[current].properties = afterConvertLifetimes.concat(ast.expression.arguments[current].properties);
    // console.log("ast.expression.arguments", ast.expression.arguments)
    return {
        index: current,
        item: afterConvertLifetimes
    };
   
    
}


// Component 相关转换结束

// Page 相关 转换 开始
// Page()方法  转 taro export default {}
const convertPageMethod = ast => {
    const n = exportDefaultDeclaration(
        ast.expression.arguments[0]
    );
    // blockStatement(ast.expression.arguments[0].properties)
    return n;
}
// data 属性 转 taro data() {return 方法}
const convertPageDataProperty = (astPage) => {
    // 匿名函数表达式
    const AnonymizeExpression = functionExpression(
        null,
        [],
        blockStatement([returnStatement(astPage.value)])
    )
    // 属性表达式
    const propertyExpression = property(
        "init",
        {
            "type": "Identifier",
            "name": astPage.key.name,
        },
        AnonymizeExpression
    )
    // 块级表达式
    // const n = blockStatement(returnStatement(astPage.value))
    // console.log('n', n);
    // 返回表达式
    // const n = returnStatement(astPage.value);
    return propertyExpression;
}
const lookInPage = ast => {
    let jsMethods = [];
    // 判断 是否是表达式
    if (ast.type === PARAMS.EXPRESSION_STATEMENT) {
        // console.log("ast.type", ast.expression.type)
        if (ast.expression.type === PARAMS.CALL_EXPRESSION) {
            // console.log("2")
                // 判断表达式，是否是 小程序的Page属性
            if (ast.expression.callee.name === WEAPP.PAGE) {
                // console.log("3 page对象")
                // Page对象
                // 遍历Page对象上的属性
                const pageArguments = ast.expression.arguments;
                pageArguments.forEach(argumentList => {
                    // console.log("4")
                    argumentList.properties.forEach((propertyItem, k) => {
                        // console.log("5")
                            // propertyItem 每一个page 上的属性
                        if (propertyItem.type == PROPERTY.PROPERTY) {
                            const filterArr = [
                                'data',
                                'onHide',
                                'onShow',
                                'onReady',
                                'onLoad',
                                'onUnload',
                                'onTabItemTap',
                                'onResize',
                                'onPageScroll',
                                'onAddToFavorites',
                                'onReachBottom',
                                'onShareTimeline',
                                'onShareAppMessage',
                                'onPullDownRefresh',
                            ]
                            if (!filterArr.includes(propertyItem.key.name)) {
                                jsMethods.push(propertyItem.key.name);
                            }
                            // 这里应该只是判断 原生自带的一些属性
                            // data属性, 转换属性如下
                            // data: {} =>  data() { return {} }
                            // console.log("6");
                            // if (propertyItem.key.name == WEAPP.DATA) {
                            //     const astPageDataNode = propertyItem;
                            //     const newData = convertPageDataProperty(astPageDataNode)
                            //     argumentList.properties[k] = newData;
                            // }
                        }
                    })

                });
                // 转换完 data 属性，再把page 自身转换
                ast = convertPageMethod(ast);
            } else if (ast.expression.callee.name === COMPONENT.COMPONENT) {
                // console.log("3 Component 对象");
                // 需要删除的,Component下的，不需要的对象
                let deletePropertyIndexArr = [];
                let newPropertysArr = null;
                // watch 新加对象
                let watchersArr = [];
                // 原始数据 watcher对象
                let oldWatcher = null;
                // watchIndex 
                let watchIndex = null;
                // Component对象
                // 遍历 Component 对象上的属性
                const componentArguments = ast.expression.arguments;
                componentArguments.forEach(argumentList => {
                    // console.log("4")
                    argumentList.properties.forEach((propertyItem, k) => {
                        // console.log("5")
                        // propertyItem 每一个 Component 上的属性
                        if (propertyItem.type == PROPERTY.PROPERTY) {
                            // 这里应该只是判断 原生自带的一些属性
                            // data属性, 转换属性如下
                            // data: {} =>  data() { return {} }
                            // console.log("6", propertyItem.key.name);
                            if (propertyItem.key.name == WEAPP.DATA) {
                                const astPageDataNode = propertyItem;
                                const newData = convertPageDataProperty(astPageDataNode)
                                argumentList.properties[k] = newData;
                            } else if (propertyItem.key.name == COMPONENT.PAGE_LIEFTIMES){
                                // convertLifeTimes(Component 组件， 当前 lifetimes)
                                // 如果lifetimes里有方法，就去转换
                                if (propertyItem.value.properties.length) {
                                    const {
                                        index,
                                        item
                                    } = convertLifeTimes(ast, propertyItem);
                                    // 记录需要删除的属性索引
                                    deletePropertyIndexArr.push(index);
                                    // 新property
                                    newPropertysArr = item;
                                    // // 删除lifetimes属性
                                    // ast.expression.arguments[index].properties.splice(index, 1);
                                    // // 合成新的Component属性
                                    // ast.expression.arguments[index].properties = item.concat(ast.expression.arguments[index].properties);
                                }
                            } else if (propertyItem.key.name == COMPONENT.PROPERTIES) {
                                propertyItem.key.name = ONLY_CHANGE_PROPERTY_NAME[propertyItem.key.name]
                                // console.log("properties");
                                console.log("propertyItem.key.name", propertyItem.key.name)
                                if (propertyItem.value.properties.length) {
                                    const { watchArr } = convertPropertiesMethods(propertyItem);
                                    watchersArr = watchersArr.concat(watchArr);
                                }
                            } else if (ONLY_CHANGE_PROPERTY_NAME[propertyItem.key.name]) {
                                // 此判断里，都是仅要改名字的属性
                                propertyItem.key.name = ONLY_CHANGE_PROPERTY_NAME[propertyItem.key.name];
                                if (propertyItem.key.name == ONLY_CHANGE_PROPERTY_NAME[COMPONENT.OBSERVERS]) {
                                    oldWatcher = propertyItem;
                                    // oldWatcher = ast.expression.arguments[0].properties[k];
                                    watchIndex = k;
                                }
                                
                            } else if (propertyItem.key.name == 'methods') {
                                propertyItem.value.properties.forEach(v => {
                                    jsMethods.push(v.key.name);
                                })
                            }
                        }
                    })
                });
                // 合并watcher
                // 如果原组件中，有watch 属性
                // 放在删除 属性之前，是因为要对原有watch位置，加属性处理，必须先加，再删
                if (oldWatcher) {
                    if (watchersArr.length) {
                        let watchProperties = oldWatcher.value.properties;
                        // 找到watch 属性，并合并新的watch
                        ast.expression.arguments[0].properties[watchIndex].value.properties = watchProperties.concat(watchersArr);
                    }
                }
                // 删除转换后，不需要的属性
                if (deletePropertyIndexArr.length) {
                    deletePropertyIndexArr.sort((a, b) => a - b);
                    deletePropertyIndexArr.forEach(v => {
                        // 删除lifetimes属性
                        ast.expression.arguments[0].properties.splice(v, 1);
                    })
                    // 合成新的Component属性
                    ast.expression.arguments[0].properties = newPropertysArr.concat(ast.expression.arguments[0].properties);
                }
                // 合并watcher
                // 如果原组件中，没有watch 属性，
                // 这里不加在  上面的判断，是因为，如果加了，会改变原来属性位置，导致删错属性
                if (!oldWatcher) {
                    if (watchersArr.length) {
                        // 找到watch 属性，并合并新的watch
                        ast.expression.arguments[0].properties.push(
                            property(
                                "init",
                                {
                                    "type": "Identifier",
                                    "name": COMPONENT.WATCH,
                                },
                                objectExpression(watchersArr)
                            )
                        );
                        // (watchProperties);
                    }
                }
                // 转换完 component中其它 属性，再把component 自身转换
                ast = convertComponentMethod(ast);
            }
        }
    }
    return jsMethods;
}
// Page 相关转换结束


const toJson = (ast) => {
    let jsMethods = [];
    // 循环遍历body下每个标签
    ast.program.body.forEach((v, i) => {
        const arr = ast.program.body[i] = lookInPage(v);
        jsMethods = jsMethods.concat(arr);
    })
    return jsMethods;
}

export default toJson;