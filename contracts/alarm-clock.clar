
;; A very simple escrow smart contract where funds are deposited
;; in the contract. After both buyer and seller agreed the funds
;; are transferred to the seller.
;;
;; For more details see docs/escrow.md

;; addresses of buyer, seller and escrow are hard-coded,
;; a new contract is needed for each deal
(define-constant owner 'ST398K1WZTBVY6FE2YEHM6HP20VSNVSSPJTW0D53M)

;; a time oracle is someone who can tell this contract that the alarm can start to ring
;; prior to the time oracle enabling the alarm, calling it will simply increase the bounty
;; because we don't want people calling that function in all hours of the day!
(define-constant timeOracle 'ST1JDEC841ZDWN9CKXKJMDQGP5TW1AM10B7EV0DV9)

(define-constant escrow 'ST398K1WZTBVY6FE2YEHM6HP20VSNVSSPJTW0D53M.escrow)

;; storage
(define-data-var bounty uint u0)
(define-data-var lastSubmitted principal 'ST398K1WZTBVY6FE2YEHM6HP20VSNVSSPJTW0D53M)
(define-data-var alarmActive bool false)

;; read-only functions
(define-read-only (get-info)
  {bounty: (var-get bounty), lastSubmitted: (var-get lastSubmitted), alarmActive: (var-get alarmActive)}
)

;; private functions

;; send 10% of bounty to the person who caused me to hit snooze!
(define-private (payout-bounty-pct)
 (begin 

   (as-contract (stx-transfer? (/ (var-get bounty) u10) escrow (var-get lastSubmitted)))
   ;; (unwrap-panic (as-contract (stx-transfer? (var-get bounty) escrow lastSubmitted)))
   (var-set bounty (/ (var-get bounty) u10)) ;; reduce bounty amount by 10%
 )
)

;; send the bounty to the person who woke me up!
(define-private (payout-bounty)
   (begin
      (as-contract (stx-transfer? (var-get bounty) escrow (var-get lastSubmitted)))
      (var-set alarmActive false) ;; turn off alarm, oracle will call this to set alarm again later
      (var-set bounty u0) ;; reset the bounty once payout has been claimed
   )
)

;; panics if not the owner
(define-private (if-not-owner-then-panic)
  (unwrap-panic
    (if (is-eq tx-sender owner)
      (ok true)
      (err 1)
    )
  )
)

;; public functions

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

;; owner hits the snooze button, the last submitted transaction gets 10% of the bounty
(define-public (snooze)
  (begin
    (if-not-owner-then-panic)
    (if (is-eq (var-get bounty) u0)
      (ok true)
      (if (> (var-get bounty) u0)
        (ok (payout-bounty-pct))         
        (ok true)
      )
    )
  )
)

;; owner hits the stop alarm button, wakes up and the last submitted transaction gets the bounty
(define-public (iamAwake)
  (begin
    (if-not-owner-then-panic)
    (if (is-eq (var-get bounty) u0)
        (ok true) ;; no bounty, no need to payout
      (if (> (var-get bounty) u0)
         (ok (payout-bounty))
         (ok true)
      )
    )
  )
)


;; everybody can try to wakeup the account owner by submitting any amount of Stacks
;; the person who wakes up the owner (i.e. when the owner calls iamAwake) gets the bounty
;; if the owner clicks snooze, then the last person to try to wake him gets 1/10th the bounty
(define-public (wakeUp (amount uint))
  (begin
    (var-set bounty (+ amount (var-get bounty)))
    (stx-transfer? amount tx-sender escrow)
    (var-set lastSubmitted tx-sender)
    (if (var-get alarmActive)
      (begin
        (print "Trigger Alarm!") ;; print the info indicating the alarm was triggered
        (ok 1)
      )
      (ok 0)
    )
  )
)

(define-public (say-hi)
   (ok "hello world"))

(define-public (echo-number (val int))
   (ok val))
