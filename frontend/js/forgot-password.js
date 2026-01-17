const form = document.getElementById("forgotForm");
const emailInput = document.getElementById("email");
const passwordSection = document.getElementById("passwordSection");
const newPassword = document.getElementById("newPassword");
const confirmPassword = document.getElementById("confirmPassword");
const errorAlert = document.getElementById("errorAlert");

let emailVerified = false;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorAlert.style.display = "none";

  try {
    // STEP 1 — Verify email
    if (!emailVerified) {
      await API.checkEmailExists(emailInput.value);

      passwordSection.style.display = "block";
      emailVerified = true;

      showMessage("Email verified. Set your new password.", false);
      return;
    }

    // STEP 2 — Validate password
    if (!validatePassword(newPassword.value)) {
      throw new Error("Password does not meet requirements");
    }

    if (newPassword.value !== confirmPassword.value) {
      throw new Error("Passwords do not match");
    }

    // STEP 3 — Reset password
    await API.resetPassword(emailInput.value, newPassword.value);

    showMessage("Password reset successful! Redirecting...", false);

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);

  } catch (err) {
    showMessage(err.message || "Something went wrong", true);
  }
});

function validatePassword(password) {
  return (
    /.{8,}/.test(password) &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password)
  );
}

function togglePasswordVisibility(id) {
  const input = document.getElementById(id);
  const icon = document.getElementById(`eye-${id}`);

  if (input.type === "password") {
    input.type = "text";
  } else {
    input.type = "password";
  }
}

function showMessage(msg, isError) {
  errorAlert.textContent = msg;
  errorAlert.style.display = "block";
  errorAlert.style.background = isError ? "#ffebee" : "#e8f5e9";
  errorAlert.style.color = isError ? "#c62828" : "#2e7d32";
}
