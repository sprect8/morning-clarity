# Alarm Contract - Or how to incentivise people to wake you up!

## Use Case
(Based on the escrow contract)

Let's imagine you set up an alarm clock that links to the blockchain. You want to incentivise people to wake you up in the morning!
We need to do this:
1. Have an oracle setup the alarm when the time is right (don't want people to call this every waking moment!)
2. Let people bid on the wake-up time (people send Stacks and the winner gets all!)
3. Allow me to click the snooze button, or click the I am Awake button. Snooze gives 10% of the bounty to the person who triggered it, and I am Awake gives the full bounty and resets the timer

## Lets get started

Checkout this repository:

```
git clone https://github.com/sprect8/morning-clarity
cd morning-clarity
npm install
```

Run the test:
```
npm run test
```

Note that I have hard-coded the keys into the smart contract; and generated 5 users (owner, oracle, and 3 bidders).
(keys[2,3,4,5].json)

Inspect the source code:
```
cd contracts
vscode alarm-clock.clar
```

Inspect the test case:
```
cd tests
vscode alarm-clock.ts
```

Key bits of the code are the oracle (which controls when an alarm can be active) - this is similar to isOwner of Solidity:
```
;; time oracle set up the alarm; only when this is called can others begin to try and wake up the owner 
(define-public (activateAlarm)
  (begin
    (if (is-eq tx-sender timeOracle)
      (begin
         (var-set alarmActive true)
         (ok 1)
      )
      (ok 0)
    )
  )
)
```

Alarms can trigger only when the oracle says so. (alarmActive set to true). However we don't stop people from bidding.
