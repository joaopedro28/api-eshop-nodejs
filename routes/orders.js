const { Order } = require('../models/order')
const express = require('express')
const { OrderItem } = require('../models/order-item')
const router = express.Router()

router.get(`/`, async (req, res) => {
	const orderList = await Order.find()
		.sort({ dateOrdered: -1 })
		.populate('user', 'name email')
		.populate({
			path: 'orderItems',
			populate: {
				path: 'product',
				select: 'name category ',
				populate: 'category',
			},
		})

	if (!orderList) {
		res.status(500).json({ success: false })
	}
	res.send(orderList)
})

router.get(`/:id`, async (req, res) => {
	const order = await Order.findById(req.params.id)
		.populate('user', 'name email')
		.populate({
			path: 'orderItems',
			populate: {
				path: 'product',
				select: 'name category ',
				populate: 'category',
			},
		})

	if (!order) {
		res.status(500).json({ success: false })
	}
	res.send(order)
})

router.post('/', async (req, res) => {
	const orderItemsIds = Promise.all(
		req.body.orderItems.map(async (orderItem) => {
			let newOrderItem = new OrderItem({
				quantity: orderItem.quantity,
				product: orderItem.product,
			})

			newOrderItem = await newOrderItem.save()

			return newOrderItem._id
		})
	)

	const orderItemsIdsResolved = await orderItemsIds

	const totalPrices = await Promise.all(
		orderItemsIdsResolved.map(async (orderItemId) => {
			const orderItem = await OrderItem.findById(orderItemId).populate(
				'product',
				'price'
			)
			const totalPrice = orderItem.product.price * orderItem.quantity
			return totalPrice
		})
	)

	const totalPrice = totalPrices.reduce((a, b) => a + b, 0)

	let order = new Order({
		orderItems: orderItemsIdsResolved,
		shippingAddress1: req.body.shippingAddress1,
		shippingAddress2: req.body.shippingAddress2,
		city: req.body.city,
		zip: req.body.zip,
		country: req.body.country,
		phone: req.body.phone,
		status: req.body.status,
		totalPrice: totalPrice,
		user: req.body.user,
	})
	order = await order.save()

	if (!order) return res.status(400).send('the order cannot be created!')

	res.send(order)
})

router.put('/:id', async (req, res) => {
	const order = await Order.findByIdAndUpdate(
		req.params.id,
		{
			status: req.body.status,
		},
		{
			new: true,
		}
	)

	if (!order) {
		return res.status(404).send('the Order cannot be edited!')
	}
	res.send(order)
	// FORMA CORRETA DE RETORNAR :
	// res.send({
	// 	status: '200',
	// 	message: 'Ok'
	// })
	// POIS EU NÃO PRECISO DO JSON INTEIRO E SIM DE UMA CONFIRMAÇÃO DE QUE DE CERTO
})

router.delete('/:id', (req, res) => {
	Order.findByIdAndRemove(req.params.id)
		.then(async (order) => {
			if (order) {
				await order.orderItems.map(async (orderItem) => {
					await OrderItem.findByIdAndRemove(orderItem) // fazer um .then() e cath()
				})
				return res.status(200).json({
					success: true,
					message: 'The order was deleted',
				})
			} else {
				return res.status(404).json({
					success: false,
					message: 'The order was not found',
				})
			}
		})
		.catch((err) => {
			return res.status(400).json({
				success: false,
				error: err,
			})
		})
})

router.get('/get/totalsales', async (req, res) => {
	const totalSales = await Order.aggregate([
		{ $group: { _id: null, totalsales: { $sum: '$totalPrice' } } },
	])

	if(!totalSales) {
		return res.status(400).send('the order sales cannot be generated')
	}

	res.send({totalsales: totalSales.pop().totalsales})
})

router.get(`/get/count`, async (req, res) => {
	const orderCount = await Order.countDocuments((count) => count);

	if (!orderCount) {
		res.status(500).json({
			success: false,
			message: 'There is any order Count'
		})
	}
	res.status(200).send({
		orderCount: orderCount
	})
})

router.get(`/get/userorders/:userid`, async (req, res) => {
	const orderUserList = await Order.find({user: req.params.userid})
		.sort({ dateOrdered: -1 })
		.populate('user', 'name email')
		.populate({
			path: 'orderItems',
			populate: {
				path: 'product',
				select: 'name category ',
				populate: 'category',
			},
		})

	if (!orderUserList) {
		res.status(500).json({ success: false })
	}
	res.send(orderUserList)
})

module.exports = router
