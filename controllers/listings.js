const Listing = require("../Models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
    const { category } = req.query;
    let allListings;

    if (category) {
        allListings = await Listing.find({ category });
    } else {
        allListings = await Listing.find({});
    }

    res.render("listings/index", { allListings , selectedCategory: category });
};

module.exports.renderNewForm = (req, res) => {
    const categories = [
        "Trending",
        "Rooms",
        "Iconic-Cities",
        "Castles",
        "Amazing-Pools",
        "Camping",
        "Farms",
        "Arctic",
        "Domes",
        "Hotel",
        "Villa",
    ];
    res.render("listings/new.ejs", { categories });
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate({ path: "reviews", populate: { path: "author" } }).populate("owner");
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist !");
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
    //   let newListing = req.body.listing; //(.listing ek object hai )
    //   console.log(newListing);
    let cordinate = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1
    }).send()

    let url = req.file.path;
    let filename = req.file.filename;
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    newListing.geometry = cordinate.body.features[0].geometry;
    let savedlisting = await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const categories = [
        "Trending",
        "Rooms",
        "Iconic-Cities",
        "Castles",
        "Amazing-Pools",
        "Camping",
        "Farms",
        "Arctic",
        "Domes",
         "Hotel",
        "Villa", 
    ];
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist !");
        return res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");

    res.render("listings/edit.ejs", { listing, originalImageUrl, categories });
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let updatedlisting = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    if (req.body.listing.location) {
        let cordinate = await geocodingClient.forwardGeocode({
            query: req.body.listing.location,
            limit: 1
        }).send();

        updatedlisting.geometry = cordinate.body.features[0].geometry;
    }

    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        updatedlisting.image = { url, filename };

    }

    await updatedlisting.save();
    req.flash("success", "Listing Updated");
    res.redirect(`/listings/${id}`);
};

module.exports.deleteListing = async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted Successfully!");
    res.redirect("/listings");
};

module.exports.searchListing = async (req, res) => {
    const { location } = req.query;

    const allListings = await Listing.find({
        $or: [
            { location: { $regex: location, $options: "i" } },
            { country: { $regex: location, $options: "i" } },
            { title: { $regex: location, $options: "i" } }
        ]
    });

    if (allListings.length === 0) {
        req.flash("error", "No listings found for this location.");
        return res.redirect("/listings");
    }

    res.render("listings/index.ejs", { allListings });
}