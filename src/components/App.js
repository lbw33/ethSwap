import React, { Component } from 'react'
import Web3 from 'web3'
import Token from '../abis/Token.json'
import EthSwap from '../abis/EthSwap.json'
import './style/App.css'
import Navbar from './Navbar'
import Main from './Main'

class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      token: {},
      ethSwap: {},
      ethBalance: '0',
      tokenBalance:'0',
      loading: true
    }
  }

  async componentWillMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
  }

  async loadBlockchainData() {
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    this.setState({ account: accounts[0] });
    const ethBalance = await web3.eth.getBalance(this.state.account);
    this.setState({ ethBalance });
    // Load Token SC
    const networkId = await web3.eth.net.getId()
    const tokenData = Token.networks[networkId]
    if (tokenData) {
      const token = new web3.eth.Contract(Token.abi, tokenData.address)
      this.setState({ token })
      let tokenBalance = await token.methods.balanceOf(this.state.account).call();
      console.log('tokenBalance:', tokenBalance.toString())
      this.setState({ tokenBalance: tokenBalance.toString() })
    } else {
      window.alert('Token contract has not been deployed to detected network.')
    }
    // Load EthSwap SC
    const ethSwapData = EthSwap.networks[networkId]
    if (ethSwapData) {
      const ethSwap = new web3.eth.Contract(EthSwap.abi, ethSwapData.address)
      this.setState({ ethSwap })
    } else {
      window.alert('EthSwap contract has not been deployed to detected network.')
    }
    console.log(this.state.ethSwap)

    this.setState({ loading: false })
  }

  loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      window.ethereum.enable();
      return true;
    }
    return false;
  }

  buyTokens = (etherAmount) => {
    this.setState({ loading: true })
    this.state.ethSwap.methods.buyTokens().send({ value: etherAmount, from: this.state.account }).on('transactionHash', (hash) => { this.setState({ loading: false }) })
  }

  sellTokens = (tokenAmount) => {
    this.setState({ loading: true })
    this.state.token.methods.approve(this.state.ethSwap.address, tokenAmount).send({ from: this.state.account }).on('transactionHash', (hash) => {
      this.state.ethSwap.methods.sellTokens(tokenAmount).send({ from: this.state.account }).on('transactionHash', (hash) => { 
        this.setState({ loading: false })
      })
    })
  }

  render() {
    let content
    if (this.state.loading) {
      content = <p id='loader' className='test-center'>Loading....</p>
    } else {
      content = <Main 
                  ethBalance={ this.state.ethBalance }
                  tokenBalance={ this.state.tokenBalance }
                  buyTokens={ this.buyTokens }
                  sellTokens={ this.sellTokens }
                />
    }
    return (
      <div>
        <Navbar account={ this.state.account } />
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 ml-auto mr-auto" style={{ maxWidth: '600px' }}>
              <div className="content mr-auto ml-auto">
                <a
                  href="http://www.dappuniversity.com/bootcamp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                </a>
                {content}
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
