'use strict';

const expect = require('chai').expect,
  sinon = require('sinon'),
  preProc = require('pre-proc'),
  fs = require('fs');

// Import functions
const src = fs.readFileSync('./lib/gnirts.js', {encoding: 'utf8'}),
  /* eslint-disable no-new-func */
  removeComments = (new Function('return ' +
    preProc.pickTag('removeComments', src)))(),
  lbIndexOf = (new Function('return ' +
    preProc.pickTag('lbIndexOf', src)))();
  /* eslint-enable no-new-func */

describe('Functions', () => {

  describe('lbIndexOf', () => {
    const indexOf = sinon.spy(String.prototype, 'indexOf'),
      substring = sinon.spy(String.prototype, 'substring');

    it('should find character at middle', () => {
      indexOf.resetHistory();
      substring.resetHistory();
      const res = lbIndexOf('abcde', 'b', '\\');
      expect(res).to.equal(1);
      expect(indexOf.calledOnce).to.be.true;
      expect(substring.calledOnce).to.be.true;
    });

    it('should find character at first', () => {
      indexOf.resetHistory();
      substring.resetHistory();
      const res = lbIndexOf('abcde', 'a', '\\');
      expect(res).to.equal(0);
      expect(indexOf.calledOnce).to.be.true;
      expect(substring.notCalled).to.be.true; // not called
    });

    it('should find character at second', () => {
      indexOf.resetHistory();
      substring.resetHistory();
      const res = lbIndexOf('abcde', 'b', '\\');
      expect(res).to.equal(1);
      expect(indexOf.calledOnce).to.be.true;
      expect(substring.calledOnce).to.be.true; // called
    });

    it('should find character at last', () => {
      indexOf.resetHistory();
      substring.resetHistory();
      const res = lbIndexOf('abcde', 'e', '\\');
      expect(res).to.equal(4);
      expect(indexOf.calledOnce).to.be.true;
      expect(substring.calledOnce).to.be.true;
    });

    it('should not find another character', () => {
      indexOf.resetHistory();
      substring.resetHistory();
      const res = lbIndexOf('abcde', 'x', '\\');
      expect(res).to.equal(-1);
      expect(indexOf.calledOnce).to.be.true;
      expect(substring.notCalled).to.be.true;
    });

    it('should find character that is first one', () => {
      indexOf.resetHistory();
      substring.resetHistory();
      const res = lbIndexOf('abcdeb', 'b', '\\');
      expect(res).to.equal(1);
      expect(indexOf.calledOnce).to.be.true;
      expect(substring.calledOnce).to.be.true;
    });

    it('should not find from empty', () => {
      indexOf.resetHistory();
      substring.resetHistory();
      const res = lbIndexOf('', 'a', '\\');
      expect(res).to.equal(-1);
      expect(indexOf.notCalled).to.be.true;
      expect(substring.notCalled).to.be.true;
    });

    it('should not find escaped character', () => {
      indexOf.resetHistory();
      substring.resetHistory();
      const res = lbIndexOf('a\\bcde', 'b', '\\');
      expect(res).to.equal(-1);
      expect(indexOf.callCount).to.equal(2);
      expect(substring.calledOnce).to.be.true;
    });

    it('should find character after escaped one', () => {
      indexOf.resetHistory();
      substring.resetHistory();
      const res = lbIndexOf('a\\bcdeb', 'b', '\\');
      expect(res).to.equal(6);
      expect(indexOf.callCount).to.equal(2);
      expect(substring.callCount).to.equal(2);
    });

    it('should find character after escaped two', () => {
      indexOf.resetHistory();
      substring.resetHistory();
      const res = lbIndexOf('a\\bcde\\bfghbijk', 'b', '\\');
      expect(res).to.equal(11);
      expect(indexOf.callCount).to.equal(3);
      expect(substring.callCount).to.equal(3);
    });

    it('should ignore escaped character at first', () => {
      indexOf.resetHistory();
      substring.resetHistory();
      const res = lbIndexOf('\\abcde\\afghaijk', 'a', '\\');
      expect(res).to.equal(11);
      expect(indexOf.callCount).to.equal(3);
      expect(substring.callCount).to.equal(3);
    });

    it('should ignore escaped character at last', () => {
      indexOf.resetHistory();
      substring.resetHistory();
      const res = lbIndexOf('\\abcde\\afgh\\a', 'a', '\\');
      expect(res).to.equal(-1);
      expect(indexOf.callCount).to.equal(3);
      expect(substring.callCount).to.equal(3);
    });

  });

  describe('removeComments', () => {

    it('should remove comments', () => {
      const res = removeComments('STR1 /* STR2 */ STR3\n// STR4\nSTR5');
      expect(res).to.equal('STR1   STR3\n STR5');
    });

    it('should ignore string quots(\')', () => {
      const res = removeComments('S\'TR1 /* STR2 */ S\'TR\'3\n// STR4\nS\'TR5 /* STR6 */ STR7');
      expect(res).to.equal('S\'TR1 /* STR2 */ S\'TR\'3\n// STR4\nS\'TR5   STR7');
    });

    it('should ignore string quots(")', () => {
      const res = removeComments('S"TR1 /* STR2 */ S"TR"3\n// STR4\nS"TR5 /* STR6 */ STR7');
      expect(res).to.equal('S"TR1 /* STR2 */ S"TR"3\n// STR4\nS"TR5   STR7');
    });

    it('should parse mixed quots', () => {
      const res = removeComments('"S\'T"R1 /* STR2 */ S\'TR\'3\n// STR4\nS\'TR5 /* STR6 */ STR7');
      expect(res).to.equal('"S\'T"R1   S\'TR\'3\n S\'TR5 /* STR6 */ STR7');
    });

    it('should parse nested those', () => {
      const res = removeComments('//S\'TR1 /* STR2 */ S\'T\n"R\'3\n// STR4\nS\'T"R5 /* STR6 */ STR7');
      expect(res).to.equal(' "R\'3\n// STR4\nS\'T"R5   STR7');
    });

    it('should get unclosed quot(\')', () => {
      const res = removeComments('\'STR1 /* STR2 */ STR3\n// STR4\nSTR5');
      expect(res).to.equal('\'STR1 /* STR2 */ STR3\n// STR4\nSTR5');
    });

    it('should get unclosed quot(")', () => {
      const res = removeComments('"STR1 /* STR2 */ STR3\n// STR4\nSTR5');
      expect(res).to.equal('"STR1 /* STR2 */ STR3\n// STR4\nSTR5');
    });

    it('should remove unclosed comment(/**/)', () => {
      const res = removeComments('STR1 /*STR2 STR3 STR4 STR5');
      expect(res).to.equal('STR1  ');
    });

    it('should remove unclosed comment(//)', () => {
      const res = removeComments('STR1 //STR2 STR3 STR4 STR5');
      expect(res).to.equal('STR1  ');
    });

  });

});
