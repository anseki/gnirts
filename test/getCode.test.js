'use strict';

const expect = require('chai').expect,
  common = require('./common'),
  gnirts = require('../lib/gnirts');

describe('getCode() --> getCode4string()', () => {

  it('should return `\'\'` if input is empty string', () => {
    expect(gnirts.getCode('')).to.equal("''");
  });

  it('should split the string and convert each part, length: 1', () => {
    const str = 'abc';
    common.random.returns(0); // Make length of part be 1

    const code = gnirts.getCode(str);
    // 3 parts
    expect((new RegExp(`^${common.getPattern4string()}\\+` +
        `${common.getPattern4string()}\\+${common.getPattern4string()}$`))
      .test(code)).to.be.true;
    expect(common.code2str(code)).to.equal(str);

    common.random.reset();
  });

  it('should split the string and convert each part, length: 4', () => {
    const str = 'abcdefghi';
    common.random.returns(0.99); // Make length of part be 4

    const code = gnirts.getCode(str);
    // 3 parts
    expect((new RegExp(`^${common.getPattern4string()}\\+` +
        `${common.getPattern4string()}\\+${common.getPattern4string()}$`))
      .test(code)).to.be.true;
    expect(common.code2str(code)).to.equal(str);

    common.random.reset();
  });

  it('should not use R36 for Non-Ascii character', () => {
    const str = 'a\uD83D\uDE4D'; // `a` + Emoji
    common.random.returns(0); // Make length of part be 1

    const code = gnirts.getCode(str);
    // 3 part
    expect((new RegExp(`^${common.getPattern4string(false)}\\+` +
        `${common.getPattern4string(false)}\\+${common.getPattern4string(false)}$`))
      .test(code)).to.be.true;
    expect(common.code2str(code)).to.equal(str);

    common.random.reset();
  });

  it('should use R36 with offset for specific character', () => {
    const str = 'a$$';
    common.random.returns(0); // Make length of part be 1

    const code = gnirts.getCode(str);
    // 3 part
    expect((new RegExp(`^${common.getPattern4string()}\\+` +
        `${common.getPattern4string()}\\+${common.getPattern4string()}$`))
      .test(code)).to.be.true;
    expect(common.code2str(code)).to.equal(str);

    common.random.reset();
  });

  it('should use R36 with leading-zeros for specific character', () => {
    const str = '0000';
    common.random.returns(0.99); // Make length of part be 2

    const code = gnirts.getCode(str);
    // 2 part
    expect((new RegExp(`^${common.getPattern4string()}\\+${common.getPattern4string()}$`))
      .test(code)).to.be.true;
    expect(common.code2str(code)).to.equal(str);

    common.random.reset();
  });

});
