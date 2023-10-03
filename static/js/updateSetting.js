const updateSettings = async (data, type) => {
  try {
    const route = type == "password" ? "updateMyPassword" : "updateMe";

    const res = await axios({
      method: "PATCH",
      url: `/api/v1/users/${route}`,
      data: data,
    });

    if (res.data.status == "success") {
      showAlert("success", `${type.toUpperCase()} updated successfully`);
    }
  } catch (error) {
    showAlert("error", error.response.data.message);
  }
};

const userDataForm = document.querySelector(".form-user-data");
const userPasswordForm = document.querySelector(".form-user-password");

if (userDataForm) {
  userDataForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const form = new FormData();

    form.append("name", document.querySelector("#name").value);
    form.append("email", document.querySelector("#email").value);
    form.append("photo", document.querySelector("#photo").files[0]);


    updateSettings(form, "data");
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const saveBtn = document.querySelector(".btn--save-password");

    saveBtn.textContent = "Updating";
    const currentPassword = document.querySelector("#password-current").value;
    const passwordConfirm = document.querySelector("#password-confirm").value;
    const password = document.querySelector("#password").value;

    await updateSettings(
      { currentPassword, passwordConfirm, password },
      "password"
    );
    document.querySelector("#password-current").value = "";
    document.querySelector("#password").value = "";
    document.querySelector("#password-confirm").value = "";
    saveBtn.textContent = "Save password";
  });
}
