const stripe = Stripe(
  "pk_test_51NuxYLFUbAScGIbRMG3MpQIegr3NuBzrfr5oi6JaZaLNO3XybO4kf8JaKzMkynCGB0YfYxSaa7YI3Wj3rgOr5E1I00GtTKIyPU"
);

const bookTour = async (tourId) => {
  try {
    // 1. Get Checkout session from api
    const session = await axios(
      `/api/v1/bookings/checkout-session/${tourId}`
    );

    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });

    // 2. Create checkout form + charge credit card
  } catch (error) {
    console.log(error);
    showAlert("error", error);
  }
};

const bookBtn = document.getElementById("book-tour");

if (bookBtn) {
  bookBtn.addEventListener("click", async (e) => {
    bookBtn.textContent = "Processing....";
    const { tourId } = bookBtn.dataset;
    bookTour(tourId);
  });
}
