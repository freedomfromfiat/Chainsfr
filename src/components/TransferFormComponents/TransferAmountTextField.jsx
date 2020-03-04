import React, { useEffect } from 'react'
import clsx from 'clsx'
import utils from '../../utils'
import { usePrevious } from '../../hooksUtils'
import { getCryptoDecimals, getCryptoSymbol } from '../../tokens'
import validator from 'validator'
import BN from 'bn.js'
import TextField from '@material-ui/core/TextField'
import InputAdornment from '@material-ui/core/InputAdornment'
import Grid from '@material-ui/core/Grid'
import Box from '@material-ui/core/Box'
import Icon from '@material-ui/core/Icon'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles'
import type { StandardTokenUnit } from '../../types/token.flow.js'
import type { TxFee } from '../../types/transfer.flow.js'

type Props = {
  accountSelection: Object,
  transferAmount: StandardTokenUnit,
  transferCurrencyAmount: StandardTokenUnit,
  currency: string,
  txFee: TxFee,
  getTxFee: Function,
  toCurrencyAmount: Function,
  toCryptoAmount: Function,
  updateForm: Function,
  formError: Object,
  actionsPending: Object,
  actionsFulfilled: Object
}
export default function TransferAmountTextField (props: Props) {
  const classes = useStyles()

  const {
    accountSelection,
    transferAmount,
    transferCurrencyAmount,
    currency,
    txFee,
    getTxFee,
    toCurrencyAmount,
    toCryptoAmount,
    updateForm,
    formError,
    actionsFulfilled
  } = props

  const prevTransferAmount = usePrevious(transferAmount)

  let balanceCurrencyAmount = '0'

  if (accountSelection) {
    balanceCurrencyAmount = toCurrencyAmount(
      accountSelection.balanceInStandardUnit,
      accountSelection.cryptoType,
      currency
    )
  }

  const validate = value => {
    const { cryptoType, balance } = accountSelection
    const INSUFFICIENT_FUNDS_FOR_TX_FEES = 'Insufficient funds for paying transaction fees'

    const decimals = getCryptoDecimals(cryptoType)
    if (
      !validator.isFloat(value, {
        min: 0.001,
        max: parseFloat(accountSelection.balanceInStandardUnit)
      })
    ) {
      if (!parseFloat(value)) {
        return null
      }
      if (parseFloat(value) < 0.001) {
        return 'The amount must be greater than 0.001'
      } else if (parseFloat(value) > parseFloat(accountSelection.balanceInStandardUnit)) {
        return `Exceed your balance of ${accountSelection.balanceInStandardUnit}`
      } else {
        return 'Please enter a valid amount'
      }
    }
    if (txFee) {
      // balance check passed
      if (['ethereum', 'dai'].includes(cryptoType)) {
        // ethereum based coins
        // now check if ETH balance is sufficient for paying tx fees
        if (
          cryptoType === 'ethereum' &&
          new BN(balance).lt(
            new BN(txFee.costInBasicUnit).add(
              utils.toBasicTokenUnit(parseFloat(value), decimals, 8)
            )
          )
        ) {
          return INSUFFICIENT_FUNDS_FOR_TX_FEES
        }
        if (cryptoType === 'dai') {
          let ethBalance = accountSelection.ethBalance
          if (new BN(ethBalance).lt(new BN(txFee.costInBasicUnit))) {
            return INSUFFICIENT_FUNDS_FOR_TX_FEES
          }
        }
      } else if (
        cryptoType === 'bitcoin' &&
        new BN(balance).lt(
          new BN(txFee.costInBasicUnit).add(utils.toBasicTokenUnit(parseFloat(value), decimals, 8))
        )
      ) {
        return INSUFFICIENT_FUNDS_FOR_TX_FEES
      }
    }
  }

  const updateAmount = (cryptoAmount, currencyAmount) => {
    let cryptoAmountVal
    let currencyAmountVal

    if (cryptoAmount) {
      cryptoAmountVal = cryptoAmount === '' ? 0.0 : parseFloat(cryptoAmount)
      currencyAmountVal = toCurrencyAmount(cryptoAmountVal, accountSelection.cryptoType)
    } else {
      currencyAmountVal = currencyAmount === '' ? 0.0 : parseFloat(currencyAmount)
      cryptoAmountVal = toCryptoAmount(currencyAmountVal, accountSelection.cryptoType)
    }

    updateForm({
      transferAmount: { $set: cryptoAmountVal.toString() },
      transferCurrencyAmount: { $set: currencyAmountVal.toString() },
      formError: {
        transferAmount: {
          $set: validate(cryptoAmountVal.toString())
        }
      }
    })
  }

  useEffect(() => {
    if (accountSelection) {
      if (prevTransferAmount !== transferAmount) {
        // if transfer amount changed, update tx fee
        getTxFee({
          fromAccount: accountSelection,
          transferAmount: transferAmount
        })
      } else if (actionsFulfilled.getTxFee) {
        // if tx fee updated, re-validate form
        updateForm({
          formError: {
            transferAmount: {
              $set: validate(transferAmount)
            }
          }
        })
      }
    }
  }, [transferAmount, txFee])

  return (
    <Grid container direction='row' justify='center' alignItems='stretch'>
      <Grid item xs={5}>
        <TextField
          margin='normal'
          fullWidth
          id='cryptoAmount'
          variant='outlined'
          error={!!formError.transferAmount}
          type='number'
          placeholder='Amount'
          helperText={
            formError.transferAmount ||
            (accountSelection
              ? `Balance: ${accountSelection.balanceInStandardUnit} ${getCryptoSymbol(
                  accountSelection.cryptoType
                )}`
              : 'Balance: 0.00')
          }
          disabled={!accountSelection}
          onChange={e => updateAmount(e.target.value, null)}
          value={transferAmount}
          InputProps={{
            endAdornment: (
              <InputAdornment position='end'>
                <Typography variant='body2' color='textSecondary'>
                  {(accountSelection && getCryptoSymbol(accountSelection.cryptoType)) || 'BTC'}
                </Typography>
              </InputAdornment>
            )
          }}
        />
      </Grid>
      <Grid item xs align='center'>
        <Box pt={2}>
          <Icon className={clsx(classes.icon, 'fa fa-exchange-alt')} />
        </Box>
      </Grid>
      <Grid item xs={5}>
        <TextField
          margin='normal'
          fullWidth
          id='currencyAmount'
          variant='outlined'
          error={!!formError.transferCurrencyAmount}
          helperText={formError.transferCurrencyAmount || `Balance: ${balanceCurrencyAmount}`}
          type='number'
          onWheel={event => {
            event.preventDefault()
          }}
          placeholder='Amount'
          disabled={!accountSelection}
          onChange={e => updateAmount(null, e.target.value)}
          value={transferCurrencyAmount}
          InputProps={{
            endAdornment: (
              <InputAdornment position='end'>
                <Typography variant='body2' color='textSecondary'>
                  {currency}
                </Typography>
              </InputAdornment>
            )
          }}
        />
      </Grid>
    </Grid>
  )
}

const useStyles = makeStyles({
  icon: {
    color: '#777777'
  }
})