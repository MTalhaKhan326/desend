const express = require('express')
const { createWallet, listWallets, getWalletInfo } = require('../controllers/wallet.controller')
const { auth } = require('../middlewares/auth')
const UserWalletInfo = require('../models/userWalletInfo.model')
const router = express.Router()

router.get('/test', auth,  async (req, res) => {
    await UserWalletInfo.sync({alter: true})
    await UserWalletInfo.truncate()

    res.status(200).json({
        success: true, 
        test: await UserWalletInfo.findAll()
    })
})
router.post('/create', auth, createWallet)
router.get('/list', listWallets)
router.get('/', auth, getWalletInfo)

module.exports = router