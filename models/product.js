const mongoose = require('mongoose')

const productSchema = mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		required: true,
	},
	richdescription: {
		type: String,
		required: false,
	},
	image: {
		type: String,
		required: false,
	},
	images: [{
		type: String,
		required: false,
	}],
	brand: {
		type: String,
		required: false,
	},
	price: {
		type: Number,
		default: 0,
		required: false,
	},
	category: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Category',
		required: true,
	},
	countInStock: {
		type: Number,
		required: true,
		min: 0,
		max: 255
	},
	rating: {
		type:Number,
		default: 0
	},
	numReviews: {
		type:Number,
		default: 0
	},
	isFeatured: {
		type:Boolean,
		default: false
	},
	dateCreated: {
		type: Date,
		default: Date.now
	}
})

productSchema.virtual('id').get(function() {
	return this._id.toHexString();
})

productSchema.set('toJSON', {
	virtuals: true
})
exports.Product = mongoose.model('Product', productSchema)
