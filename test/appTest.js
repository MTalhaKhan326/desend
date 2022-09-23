const assert = require('chai').assert;

const sayHello = function () {
  return 1
}

describe('Say Hello Function In Testing Mode', function () {
  let result = sayHello();

  it('function sayHello should return hello', function () {
    console.log('result is :', result)
    assert.equal(result, 'hello')
  });

  it('output of resturn should be string', function () {
    assert.typeOf(result, 'string')
  })
})