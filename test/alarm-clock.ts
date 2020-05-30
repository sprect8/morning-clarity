import { Client, Provider, ProviderRegistry, Result } from "@blockstack/clarity";
import { assert } from "chai";
import * as fs from "fs";

describe("alarm-clock contract test suite", () => {
  let alarmClockClient: Client;
  let provider: Provider;
  const ownerKey = JSON.parse(fs.readFileSync("./keys.json").toString());
  const oracleKey = JSON.parse(fs.readFileSync("./keys2.json").toString());

  const bidder1 = JSON.parse(fs.readFileSync("./keys3.json").toString());
  const bidder2 = JSON.parse(fs.readFileSync("./keys4.json").toString());
  const bidder3 = JSON.parse(fs.readFileSync("./keys5.json").toString());

  before(async () => {
    provider = await ProviderRegistry.createProvider();
    alarmClockClient = new Client("ST398K1WZTBVY6FE2YEHM6HP20VSNVSSPJTW0D53M.alarm-clock", "alarm-clock", provider);
  });

  /******************************************************/
  // hello world tests - i based this off hello world!
  it("should have a valid syntax", async () => {
    await alarmClockClient.checkContract();
  });

  describe("deploying an instance of the contract", () => {
    before(async () => {
      await alarmClockClient.deployContract();
    });

    it("should return 'hello world'", async () => {
      const query = alarmClockClient.createQuery({ method: { name: "say-hi", args: [] } });
      const receipt = await alarmClockClient.submitQuery(query);
      const result = Result.unwrapString(receipt);
      assert.equal(result, "hello world");
    });

    it("should echo number", async () => {
      const query = alarmClockClient.createQuery({
        method: { name: "echo-number", args: ["123"] }
      });
      const receipt = await alarmClockClient.submitQuery(query);
      const result = Result.unwrapInt(receipt)
      assert.equal(result, 123);
    });
  });

  /******************************************************/
  // begin my alarm clock tests on a testnet

  const helpVerifyStuff = async (address, amount, alarmActive = false) => {
    const query = alarmClockClient.createQuery({
      method: { name: "get-info", args: [] }
    });
    let receipt = await alarmClockClient.submitQuery(query);
    let result = Result.unwrap(receipt)
    assert.equal(result.indexOf(address) >= 0, true); // why you no unwrap tuple?
    assert.equal(result.indexOf(amount) >= 0, true); // why you no unwrap tuple?
    assert.equal(result.indexOf("alarmActive " + alarmActive) >= 0, true); // why you no unwrap tuple?
  }

  const makeBid = async (address, amount, verify) => {
    let tx = alarmClockClient.createTransaction({ method: { name: "wakeUp", args: [amount] } }); // why do i need to put a u here?!
    tx.sender = address;
    let receipt = await alarmClockClient.submitTransaction(tx);
    let result = Result.unwrap(receipt);
    assert.equal(result.indexOf(`Transaction executed and committed. Returned: ${verify}\n`) >= 0, true); // why does it not unwrap wtf?
  }

  describe("test alarm contract normal flow", () => {

    it("it should trigger alarm and pay bidder 3 the winning bounty", async () => {

      // bidder1 places 10 stacks - return 0 because oracle hasn't let the alarm start yet!
      await makeBid(bidder1.stacksAddress, "u10", 0);
      // confirm what we did above saved in the variables (bidder1, and 10)
      await helpVerifyStuff(bidder1.stacksAddress, "u10");


      // bidder2 places 20 stacks
      await makeBid(bidder2.stacksAddress, "u20", 0);
      // confirm what we did above saved in the variables (bidder2, and 30)
      await helpVerifyStuff(bidder2.stacksAddress, "u30");


      // verify oracle can activate alarm
      let tx = alarmClockClient.createTransaction({ method: { name: "activateAlarm", args: [] } }); 
      tx.sender = oracleKey.stacksAddress;
      let receipt = await alarmClockClient.submitTransaction(tx);
      let result = Result.unwrap(receipt);
      assert.equal(result, "Transaction executed and committed. Returned: 1\n[]"); // why does it not unwrap wtf?
      // confirm what we did above saved in the variables (bidder2, and 30)
      await helpVerifyStuff(bidder2.stacksAddress, "u30", true);


      // bidder3 places 50 stacks
      await makeBid(bidder3.stacksAddress, "u30", 1);
      // confirm what we did above saved in the variables (bidder2, and 30)
      await helpVerifyStuff(bidder3.stacksAddress, "u60", true);

      // pay bidder 3 the winning stacks!
      tx = alarmClockClient.createTransaction({ method: { name: "iamAwake", args: [] } }); // why do i need to put a u here?!
      tx.sender = ownerKey.stacksAddress;
      receipt = await alarmClockClient.submitTransaction(tx);
      result = Result.unwrap(receipt);
      console.log(result);
    });
  });

  after(async () => {
    await provider.close();
  });
});
