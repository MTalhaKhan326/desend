const { WalletServer, Seed } = require('cardano-wallet-js');
const bcrypt = require("bcryptjs");
const UserWalletInfo = require('../models/userWalletInfo.model');
let walletServer = WalletServer.init("http://110.93.240.152:8090/v2")

exports.createWallet = async (req, res, next) => {
    try {
        let name = req.body.name 
        let passphrase = req.body.passphrase 
        if(!name || !passphrase) {
            throw('Incomplete request. Please provide name and passphrase!')
        }

        let walletInfo = await UserWalletInfo.findOne({
            where: {
                userId: req.user.id
            }
        })
        
        if(!walletInfo) {
            walletInfo = await UserWalletInfo.create({
                name, 
                passphrase: bcrypt.hashSync(passphrase, 8), 
                userId: req.user.id,
                recoveryPhrase: Seed.generateRecoveryPhrase()
            })
        } else if(walletInfo && (!bcrypt.compareSync(passphrase, walletInfo.passphrase) || walletInfo.name !== name)) {
            throw('Wrong name or passphrase!')
        }

        if(!walletInfo) {
            throw('You are not allowed to create the wallet')
        }

        // return res.status(200).json({
        //     info: await walletServer.getNetworkInformation()
        // })

        let mnemonicSentence = Seed.toMnemonicList(walletInfo.recoveryPhrase)

        // return res.status(200).json({
        //     walletInfo,
        //     name: walletInfo.name,
        //     mnemonicSentence,
        //     passphrase
        // })
        
        // let wallets = await walletServer.wallets()

        // return res.status(200).json({
        //     wallets
        // })
        let wallet
        if(!walletInfo.walletId) {
            wallet = await walletServer.createOrRestoreShelleyWallet(
                name,
                mnemonicSentence,
                passphrase
            )

            await UserWalletInfo.update({
                walletId: wallet.id
            }, { where: { id: walletInfo.id } })
        } else {
            let wallets = await walletServer.wallets()
            wallet = wallets.find(w => w.id === walletInfo.walletId)
        }

        // let shelleyWallet = await walletServer.getShelleyWallet(wallet.id)

        return res.status(200).json({
            success: true,
            wallet,
            walletInfo,
        })
    } catch(e) {
        return res.status(400).json({
            error: true,
            message: e
        })
    }
}

exports.listWallets = async (req, res, next) => {
    try {
        // let wallets = await walletServer.wallets()
        
        return res.status(200).json({
            info: await walletServer.getNetworkInformation()
        })
    } catch(e) {
        return res.status(400).json({
            error: true,
            message: e
        })
    }
}

exports.getWalletInfo = async (req, res, next) => {
    try {
        let userId = req.user.id
        let walletInfo = await UserWalletInfo.findOne({
            where: {
                userId: userId
            }
        })
        
        if(!walletInfo || !walletInfo.walletId) {
            throw('Wallet not found!')
        }

        let wallets = await walletServer.wallets()
        let wallet = wallets.find(w => w.id === walletInfo.walletId)

        return res.status(200).json({
            success: true,
            wallet,
            walletInfo
        })

    } catch(e) {
        return res.json(400).json({
            error: true,
            message: e
        })
    }
}