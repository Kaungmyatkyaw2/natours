
const login = async (email, password) => {
  try {
    const res = await axios({
      method: "POST",
      url: "/api/v1/users/login",
      data: {
        email,
        password,
      },
    });


    if (res.data.status == "success") {
      showAlert("success", "Logged in successfully");
      window.setTimeout(() => {
        location.assign("/");
      }, 1500);
    }
  } catch (error) {
    showAlert("error", error.response.data.message);
  }
};

const form = document.querySelector(".form.form--login");

if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.querySelector("#email").value;
    const password = document.querySelector("#password").value;
    login(email, password);
  });
}

const logout = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: "/api/v1/users/logout",
    });
    if (res.data.status == "success") {
      location.reload(true);
    }
  } catch (error) {
    console.log(error.response);
    showAlert("error", "Error logging out! Try Again.");
  }
};

const logoutBtn = document.querySelector(".nav__el--logout");

if (logoutBtn) {
  logoutBtn.addEventListener("click", (e) => {
    logout();
  });
}
