import React, { Component } from 'react'
import { connect } from 'react-redux'
import Receipt from '../components/ReceiptComponent'

class ReceiptContainer extends Component {
  render () {
    return (
      <Receipt
        {...this.props}
      />
    )
  }
}

const mapStateToProps = state => {
  return {
    cryptoSelection: state.formReducer.cryptoSelection,
    metamask: state.walletReducer.metamask,
    gasCost: state.transferReducer.gasCost,
    receipt: state.transferReducer.receipt
  }
}

export default connect(
  mapStateToProps,
  null
)(ReceiptContainer)
