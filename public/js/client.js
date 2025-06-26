angular.module('cryptoApp', [])
.controller('TransferController', function ($http, $scope) {
  var vm = this;
  const { ethers } = window.ethers;
  vm.ethers = ethers;

  vm.showSettings  = false;
  vm.settings =  {
    signerid: 75,
    appname: 'Chain Pay',
    themeColor: '#ef5e15'
  }

  vm.saveSettings = function () {
    console.log('Settings saved:', this.settings);
    vm.showSettings = false; // Close modal
  }

  vm.tokens = [
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'USDT', name: 'Tether (USDT)' },
    { symbol: 'USDC', name: 'USD Coin (USDC)' }
  ];

  vm.form = {
    from: '',
    to: '',
    currency: '',
    amount: ''
  };

  vm.walletAddress = '';
  vm.successMsg = '';
  vm.success = false;
  vm.loading = false;
  vm.showMessage = false;

  vm.shortenAddress = function(address, start = 6, end = 4) {
    if (!address || address.length < start + end + 2) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  }

  vm.connectWallet = async function () {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        vm.walletAddress = accounts[0];
        $scope.$apply();
      } catch (err) {
        alert('Wallet connection failed.');
      }
    } else {
      alert('MetaMask is not installed.');
    }
  };

  vm.popupWallet = async function (payload) {
    // const amount = '0'; // Reset USDT spend
    var contractAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7';  // Tether contract address
    var abi = JSON.parse('[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}]');

    var erc20Contract = new web3.eth.Contract(abi, contractAddress);
    // Convert 50 USDT (6 decimals)
    const amount = vm.ethers.parseUnits(payload.amount.toString(), 6);
    console.log("USDT raw amount:", amount);
    var functionData = erc20Contract.methods.transfer(payload.to, amount).encodeABI()

    // Set the gas price in gwei (1 gwei = 1e9 wei)
    const gasPriceInGwei = '20';
    // Convert gas price to wei (1 gwei = 1e9 wei)
    const gasPriceInWei = web3.utils.toWei(gasPriceInGwei, 'gwei');
    await window.ethereum.request({
      "method": "eth_sendTransaction",
      "params": [
        {
          "to": contractAddress,
          "from": payload.from,
          "data": functionData,
        }
      ]
    });
  }

  vm.showEventDescription = function () {
    vm.displayEventDescription = true;
    $scope.$applyAsync();
  };

  vm.transfer = async function () {
    if (window.ethereum) {
      window.web3 = new Web3(ethereum);
      ethereum.enable().catch(() => {
        console.warn("User didn't allow access to accounts.");
      });
    } else {
      alert("Non-Ethereum enabled browser detected. You should consider installing MetaMask.");
      return;
    }

    vm.loading = true;
    vm.showMessage = false;
    vm.displayEventDescription = false;
    vm.highestSeverityNotNull = false;
    var signerid = vm.settings.signerid ?? vm.settings.signerid ?? 75;

    let payload = {
      from: vm.walletAddress,
      to: vm.form.to,
      currency: vm.form.currency,
      amount: vm.form.amount,
      signerid: signerid
    };

    $http.post('/gate-signer-check', payload, {
      headers: {
        'Content-Type': 'application/json',
      }
    }).then(function (response) {
      console.log('Success:', response.data);

      const highestSeverity = response.data?.result?.highest_severity;
      const firstEventDescription = response.data?.result?.events?.[0]?.description;

      if (highestSeverity === null) {
        vm.success = true;
        vm.showMessage = true;
        vm.successMsg = "Transfer of " + vm.form.amount + " " + vm.form.currency + " to " + vm.shortenAddress(vm.form.to) + " has passed the Hexagate GateSigner Validation.";
        vm.popupWallet(payload);
        vm.highestSeverityNotNull = false;
      } else {
        vm.showMessage = true;
        vm.successMsg = "Transfer of " + vm.form.amount + " " + vm.form.currency + " to " + vm.shortenAddress(vm.form.to) + " has failed the Hexagate GateSigner Validation.";
        vm.highestSeverityNotNull = true;
        vm.eventDescription = firstEventDescription;
      }

    }).catch(function (error) {
      console.error('Error:', error.data || error);
    }).finally(function () {
      vm.loading = false;
      $scope.$applyAsync();
    });
  };
});