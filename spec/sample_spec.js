// Easy
assert.isTrue(true);    // 成功
assert.isFalse(true);   // 失敗

// Jasmin
describe('Jasminのテスト', function() {
    it("真になるべき", function() {
        expect(true).toEqual(true); // 成功
    });
});
