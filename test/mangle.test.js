'use strict';

const expect = require('chai').expect,
  common = require('./common'),
  gnirts = require('../lib/gnirts');

function escapePattern(pattern) {
  return pattern.replace(/[\x00-\x7f]/g, // eslint-disable-line no-control-regex
    s => '\\x' + ('00' + s.charCodeAt().toString(16)).substr(-2));
}

describe('mangle()', () => {

  describe('directive pattern', () => {
    const LF = '\x0A',
      CRLF = '\x0D\x0A';

    it('should catch `/* @mangle */ ... /* @/mangle */`', () => {
      const str = '/* @mangle */ "" /* @/mangle */',
        code = gnirts.mangle(str);
      expect(code).to.equal("''");
    });

    it('should catch `/* @mangle */ ... /* @/mangle */` with LF', () => {
      const str = `/*   ${LF}@mangle   ${LF}${LF}*/ ${LF}${LF}  ""   ${LF}/*   ${LF}@/mangle   ${LF}*/`,
        code = gnirts.mangle(str);
      expect(code).to.equal("''");
    });

    it('should catch `/* @mangle */ ... /* @/mangle */` with CRLF', () => {
      const str = `/*   ${CRLF}@mangle   ${CRLF}${CRLF}*/ ${CRLF}${CRLF}` +
          `  ""   ${CRLF}/*   ${CRLF}@/mangle   ${CRLF}*/`,
        code = gnirts.mangle(str);
      expect(code).to.equal("''");
    });

    it('should catch `// @mangle ... // @/mangle` with LF', () => {
      const str = `//   @mangle ${LF}  "" ${LF} //  @/mangle`,
        code = gnirts.mangle(str);
      expect(code).to.equal("''");
    });

    it('should catch `// @mangle ... // @/mangle` with LF (eol)', () => {
      const str = `//   @mangle ${LF}  "" ${LF} //  @/mangle${LF}`,
        code = gnirts.mangle(str);
      expect(code).to.equal(`''${LF}`);
    });

    it('should catch `// @mangle ... // @/mangle` with CRLF', () => {
      const str = `//   @mangle ${CRLF}  "" ${CRLF} //  @/mangle`,
        code = gnirts.mangle(str);
      expect(code).to.equal("''");
    });

    it('should catch `// @mangle ... // @/mangle` with CRLF (eol)', () => {
      const str = `//   @mangle ${CRLF}  "" ${CRLF} //  @/mangle${CRLF}`,
        code = gnirts.mangle(str);
      expect(code).to.equal(`''${CRLF}`);
    });

    it('should catch mixed code', () => {
      const str = `/*   ${LF}@mangle   ${LF}${LF}*/ ${LF}${LF}  ""   ${LF}/*   ${LF}@/mangle   ${LF}*/` +
          `foo//   @mangle ${LF}  "" ${LF} //  @/mangle${LF}`,
        code = gnirts.mangle(str);
      expect(code).to.equal(`''foo''${LF}`);
    });

    it('should ignore comment', () => {
      const str = `/*@mangle*/${LF}/*CMT*/${LF}//CMT${LF}""${LF}/*CMT*/${LF}//CMT${LF}/*@/mangle*/`,
        code = gnirts.mangle(str);
      expect(code).to.equal("''");
    });

    it('should not consider `//` in a literal as a comment', () => {
      common.random.restore();
      const str = '/* @mangle */ "http://example.com/" /* @/mangle */',
        code = gnirts.mangle(str);
      expect(common.code2str(code)).to.equal('http://example.com/');
      common.random.reset();
    });

    it('should not consider `/*...*/` in a literal as a comment', () => {
      common.random.restore();
      const str = '/* @mangle */ "STR1/*STR2" + "STR3*/STR4" /* @/mangle */',
        code = gnirts.mangle(str);
      expect(common.code2str(code)).to.equal('STR1/*STR2STR3*/STR4');
      common.random.reset();
    });

    it('should ignore literal in `//` comment', () => {
      common.random.restore();
      const str = `/*@mangle*/${LF}"STR1" +${LF}//CMT "STR2" +${LF}"STR3" +${LF}//CMT 'STR4' +${LF}'STR5'/*@/mangle*/`,
        code = gnirts.mangle(str);
      expect(common.code2str(code)).to.equal('STR1STR3STR5');
      common.random.reset();
    });

    it('should ignore literal in `/*...*/` comment', () => {
      common.random.restore();
      const str = '/*@mangle*/"STR1" + /*CMT "STR2" +*/"STR3" + /*CMT \'STR4\' +*/\'STR5\'/*@/mangle*/',
        code = gnirts.mangle(str);
      expect(common.code2str(code)).to.equal('STR1STR3STR5');
      common.random.reset();
    });

    describe('copied conjunctions', () => {

      describe('in the literal', () => {

        ['(', ')', '+', ',', ':', ';', '=', '?', '[', ']', '{', '}'].forEach(cnj => {

          it(`should copy \`${cnj}\` at the left`, () => {
            const val = 'foo',
              str = `v1 = /* @mangle */${cnj}'${val}'/* @/mangle */;`;
            common.random.returns(0.99); // Make length of part be 2
            common.fixTryR36();

            const code = gnirts.mangle(str),
              escCnj = escapePattern(cnj);
            // 3 part
            expect((new RegExp(`^v1 = ${escCnj}${common.getPattern4string()}\\+` +
                `${common.getPattern4string()}\\+${common.getPattern4string()};$`))
              .test(code)).to.be.true;
            expect(common.code2str(
              code.replace(new RegExp(`^v1 = ${escCnj}(.+);$`), '$1'))).to.equal(val);

            common.random.reset();
          });

          it(`should copy \`${cnj}\` at the left with space`, () => {
            const val = 'foo',
              str = `v1 = /* @mangle */ ${cnj}'${val}'/* @/mangle */;`;
            common.random.returns(0.99); // Make length of part be 2
            common.fixTryR36();

            const code = gnirts.mangle(str),
              escCnj = escapePattern(cnj);
            // 3 part
            expect((new RegExp(`^v1 = ${escCnj}${common.getPattern4string()}\\+` +
                `${common.getPattern4string()}\\+${common.getPattern4string()};$`))
              .test(code)).to.be.true;
            expect(common.code2str(
              code.replace(new RegExp(`^v1 = ${escCnj}(.+);$`), '$1'))).to.equal(val);

            common.random.reset();
          });

          it(`should copy \`${cnj}\` at the both sides with spaces`, () => {
            const val = 'foo',
              str = `v1 = /* @mangle */ ${cnj}  '${val}'  ${cnj}   /* @/mangle */;`;
            common.random.returns(0.99); // Make length of part be 2
            common.fixTryR36();

            const code = gnirts.mangle(str),
              escCnj = escapePattern(cnj);
            // 3 part
            expect((new RegExp(`^v1 = ${escCnj}${common.getPattern4string()}\\+` +
                `${common.getPattern4string()}\\+${common.getPattern4string()}${escCnj};$`))
              .test(code)).to.be.true;
            expect(common.code2str(
              code.replace(new RegExp(`^v1 = ${escCnj}(.+)${escCnj};$`), '$1'))).to.equal(val);

            common.random.reset();
          });

        });

        it('should deny `$`', () => {
          const str = 'v1 = /* @mangle */ $ \'foo\' /* @/mangle */;';
          expect(() => { gnirts.mangle(str); }).to.throw('Invalid directive: $ \'foo\'');
        });

        it('should deny `$` with accepted one', () => {
          const str = 'v1 = /* @mangle */ + \'foo\' $ /* @/mangle */;';
          expect(() => { gnirts.mangle(str); }).to.throw('Invalid directive: + \'foo\' $');
        });

      });

      describe('in the match', () => {

        ['&&', '||', '(', ')', ',', ':', ';', '=', '?', '[', ']', '{', '}'].forEach(cnj => {

          it(`should copy \`${cnj}\` at the left`, () => {
            const val = 'foo',
              str = `if (/* @mangle */${cnj}v1 === '${val}'/* @/mangle */) {}`;
            common.random.returns(0.99); // Make length of part be 2

            const code = gnirts.mangle(str),
              escCnj = escapePattern(cnj);
            expect(code).to.not.equal(str);
            expect(common.code2str(
              `(()=>{var v1='${escapePattern(val)}';return ${
                code.replace(new RegExp(`^if \\(${escCnj}(.+)\\) \\{\\}`), '$1')};})()`)).to.be.true;

            common.random.reset();
          });

          it(`should copy \`${cnj}\` at the left with space`, () => {
            const val = 'foo',
              str = `if (/* @mangle */ ${cnj}v1 === '${val}'/* @/mangle */) {}`;
            common.random.returns(0.99); // Make length of part be 2

            const code = gnirts.mangle(str),
              escCnj = escapePattern(cnj);
            expect(code).to.not.equal(str);
            expect(common.code2str(
              `(()=>{var v1='${escapePattern(val)}';return ${
                code.replace(new RegExp(`^if \\(${escCnj}(.+)\\) \\{\\}`), '$1')};})()`)).to.be.true;

            common.random.reset();
          });

          it(`should copy \`${cnj}\` at the both sides with spaces`, () => {
            const val = 'foo',
              str = `if (/* @mangle */ ${cnj}  v1 === '${val}'  ${cnj}   /* @/mangle */) {}`;
            common.random.returns(0.99); // Make length of part be 2

            const code = gnirts.mangle(str),
              escCnj = escapePattern(cnj);
            expect(code).to.not.equal(str);
            expect(common.code2str(
              `(()=>{var v1='${escapePattern(val)}';return ${
                code.replace(new RegExp(`^if \\(${escCnj}(.+)${escCnj}\\) \\{\\}`), '$1')};})()`)).to.be.true;

            common.random.reset();
          });

        });

        it('should accept unknown string at the left as target', () => {
          const val = 'foo',
            val2 = 16,
            str = `if (/* @mangle */${val2}+v1 === '${val2}${val}'/* @/mangle */) {}`;
          common.random.returns(0.99); // Make length of part be 2

          const code = gnirts.mangle(str);
          expect(code).to.not.equal(str);
          expect(common.code2str(
            `(()=>{var v1='${escapePattern(val)}';return ${
              code.replace(/^if \((.+)\) \{\}/, '$1')};})()`)).to.be.true;

          common.random.reset();
        });

        it('should deny `$` with accepted one', () => {
          const str = 'if (/* @mangle */ + v1 === \'foo\' $ /* @/mangle */) {}';
          expect(() => { gnirts.mangle(str); }).to.throw('Invalid directive: + v1 === \'foo\' $');
        });

      });

    });
  });

  describe('case of the literal', () => {

    it('should get simple literal', () => {
      const val = 'foo',
        str = `v1 = /* @mangle */ '${val}' /* @/mangle */;`;
      common.random.returns(0.99); // Make length of part be 2
      common.fixTryR36();

      const code = gnirts.mangle(str);
      // 3 part
      expect((new RegExp(`^v1 = ${common.getPattern4string()}\\+` +
          `${common.getPattern4string()}\\+${common.getPattern4string()};$`))
        .test(code)).to.be.true;
      expect(common.code2str(code.replace(/^v1 =/, ''))).to.equal(val);

      common.random.reset();
    });

  });

  describe('case of the match', () => {

    describe('getCode4match()', () => {

      it('should return `\'\'` if input is empty string with `===`', () => {
        const str = '/*@mangle*/ v1===\'\' //  @/mangle',
          code = gnirts.mangle(str);
        expect(code).to.equal('v1===\'\'');
      });

      it('should return `\'\'` if input is empty string with `!==`', () => {
        const str = '/*@mangle*/ v1!==\'\' //  @/mangle',
          code = gnirts.mangle(str);
        expect(code).to.equal('!(v1===\'\')');
      });

      common.testCases.forEach(testCase => {
        [0, 0.99].forEach(caseRandom => {
          it(`should cover ${testCase.title}, random: ${caseRandom}`, () => {
            common.random.returns(caseRandom);
            const escapedValue = escapePattern(testCase.value);
            let str,
              code;

            // Condition expression `===`
            str = `/* @mangle */ v1 === '${escapedValue}'/* @/mangle */`;
            code = gnirts.mangle(str);
            expect(code).to.not.equal(str);
            expect(common.code2str(
              `(()=>{var v1='${escapedValue}';return ${code};})()`)).to.be.true;

            // Condition expression `!==`
            str = `/* @mangle */ v1 !== '${escapedValue}'/* @/mangle */`;
            code = gnirts.mangle(str);
            expect(code).to.not.equal(str);
            expect(common.code2str(
              `(()=>{var v1='${escapedValue}';return ${code};})()`)).to.be.false;

            common.random.reset();
          });

          it(`should cover ${testCase.title}, random: ${caseRandom}, with invalid chars in mangle target`, () => {
            common.random.returns(caseRandom);
            const escapedValue = escapePattern(testCase.value);
            let str,
              code;

            // ---- Left

            // Condition expression `===`
            str = `/* @mangle */ v1 === 'XXX${escapedValue}'/* @/mangle */`;
            code = gnirts.mangle(str);
            expect(code).to.not.equal(str);
            expect(common.code2str(
              `(()=>{var v1='${escapedValue}';return ${code};})()`)).to.be.false;

            // Condition expression `!==`
            str = `/* @mangle */ v1 !== 'XXX${escapedValue}'/* @/mangle */`;
            code = gnirts.mangle(str);
            expect(code).to.not.equal(str);
            expect(common.code2str(
              `(()=>{var v1='${escapedValue}';return ${code};})()`)).to.be.true;

            // ---- Right

            // Condition expression `===`
            str = `/* @mangle */ v1 === '${escapedValue}XXX'/* @/mangle */`;
            code = gnirts.mangle(str);
            expect(code).to.not.equal(str);
            expect(common.code2str(
              `(()=>{var v1='${escapedValue}';return ${code};})()`)).to.be.false;

            // Condition expression `!==`
            str = `/* @mangle */ v1 !== '${escapedValue}XXX'/* @/mangle */`;
            code = gnirts.mangle(str);
            expect(code).to.not.equal(str);
            expect(common.code2str(
              `(()=>{var v1='${escapedValue}';return ${code};})()`)).to.be.true;

            // ---- Both

            // Condition expression `===`
            str = `/* @mangle */ v1 === 'XXX${escapedValue}XXX'/* @/mangle */`;
            code = gnirts.mangle(str);
            expect(code).to.not.equal(str);
            expect(common.code2str(
              `(()=>{var v1='${escapedValue}';return ${code};})()`)).to.be.false;

            // Condition expression `!==`
            str = `/* @mangle */ v1 !== 'XXX${escapedValue}XXX'/* @/mangle */`;
            code = gnirts.mangle(str);
            expect(code).to.not.equal(str);
            expect(common.code2str(
              `(()=>{var v1='${escapedValue}';return ${code};})()`)).to.be.true;

            common.random.reset();
          });

          it(`should cover ${testCase.title}, random: ${caseRandom}, with invalid chars in variable`, () => {
            common.random.returns(caseRandom);
            const escapedValue = escapePattern(testCase.value);
            let str,
              code;

            // ---- Left

            // Condition expression `===`
            str = `/* @mangle */ v1 === '${escapedValue}'/* @/mangle */`;
            code = gnirts.mangle(str);
            expect(code).to.not.equal(str);
            expect(common.code2str(
              `(()=>{var v1='XXX${escapedValue}';return ${code};})()`)).to.be.false;

            // Condition expression `!==`
            str = `/* @mangle */ v1 !== '${escapedValue}'/* @/mangle */`;
            code = gnirts.mangle(str);
            expect(code).to.not.equal(str);
            expect(common.code2str(
              `(()=>{var v1='XXX${escapedValue}';return ${code};})()`)).to.be.true;

            // ---- Right

            // Condition expression `===`
            str = `/* @mangle */ v1 === '${escapedValue}'/* @/mangle */`;
            code = gnirts.mangle(str);
            expect(code).to.not.equal(str);
            expect(common.code2str(
              `(()=>{var v1='${escapedValue}XXX';return ${code};})()`)).to.be.false;

            // Condition expression `!==`
            str = `/* @mangle */ v1 !== '${escapedValue}'/* @/mangle */`;
            code = gnirts.mangle(str);
            expect(code).to.not.equal(str);
            expect(common.code2str(
              `(()=>{var v1='${escapedValue}XXX';return ${code};})()`)).to.be.true;

            // ---- Both

            // Condition expression `===`
            str = `/* @mangle */ v1 === '${escapedValue}'/* @/mangle */`;
            code = gnirts.mangle(str);
            expect(code).to.not.equal(str);
            expect(common.code2str(
              `(()=>{var v1='XXX${escapedValue}XXX';return ${code};})()`)).to.be.false;

            // Condition expression `!==`
            str = `/* @mangle */ v1 !== '${escapedValue}'/* @/mangle */`;
            code = gnirts.mangle(str);
            expect(code).to.not.equal(str);
            expect(common.code2str(
              `(()=>{var v1='XXX${escapedValue}XXX';return ${code};})()`)).to.be.true;

            common.random.reset();
          });
        });
      });

      it('should split the string and compare each part, length: 1', () => {
        const val = 'abc',
          str = `/* @mangle */ v1 === '${val}'/* @/mangle */`;
        common.random.returns(0); // Make length of part be 1
        common.fixTryR36();

        const code = gnirts.mangle(str),
          pattern = common.getPattern4match(3); // 3 parts
        expect((new RegExp(pattern)).test(code)).to.be.true;
        expect(common.code2str(`(()=>{var v1='${val}';return ${code};})()`)).to.be.true;

        common.random.reset();
      });

    });
  });

  describe('invalid pattern', () => {

    it('should throw when `/* @mangle */ foo /* @/mangle */`', () => {
      const str = '/* @mangle */ foo /* @/mangle */';
      expect(() => { gnirts.mangle(str); }).to.throw('Invalid directive: foo');
    });

    it('should throw when `/* @mangle */ \'\' + foo + \'\' /* @/mangle */`', () => {
      const str = '/* @mangle */ \'\' + foo + \'\' /* @/mangle */';
      expect(() => { gnirts.mangle(str); }).to.throw(/Invalid code:/);
    });

  });

});
