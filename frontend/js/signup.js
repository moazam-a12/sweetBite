// Unified Signup System

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("signupForm");
    const errorAlert = document.getElementById("errorAlert");
    const successAlert = document.getElementById("successAlert");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name");
        const email = document.getElementById("email");
        const password = document.getElementById("password");
        const confirmPassword = document.getElementById("confirmPassword");

        // Reset validation
        [name, email, password, confirmPassword].forEach(el => {
            el.classList.remove("is-invalid");
        });
        if (errorAlert) {
            errorAlert.style.display = "none";
            errorAlert.classList.add("d-none");
        }
        if (successAlert) {
            successAlert.style.display = "none";
            successAlert.classList.add("d-none");
        }

        // Validate
        let valid = true;

        // Full name validation (requires first and last name)
        if (!/^[A-Za-z]+(?:\s+[A-Za-z]+)+$/.test(name.value.trim())) {
            name.classList.add("is-invalid");
            valid = false;
        }

        // Validate email: Check for proper email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
            email.classList.add("is-invalid");
            valid = false;
        }

        // Validate password: Ensure it meets criteria (min length, uppercase, lowercase, number, special char)
        if (!validatePassword(password.value)) {
            password.classList.add("is-invalid");
            valid = false;
        }

        // Validate confirm password: Check if it matches password
        if (password.value !== confirmPassword.value) {
            confirmPassword.classList.add("is-invalid");
            valid = false;
        }

        // If not valid, show error message
        if (!valid) {
            if (errorAlert) {
                errorAlert.textContent = "Please fix the errors above";
                errorAlert.style.display = "block";
                errorAlert.classList.remove("d-none");
            }
            return;
        }

        try {
            // SAFETY CHECK — prevents silent failure if API is missing
            if (!window.API || typeof API.signup !== "function") {
                console.error("API.signup is not available", window.API);
                throw new Error("Internal error: API not loaded");
            }

            // Call signup API (backend assigns 'pending' role)
            const data = await API.signup(
                name.value.trim(),
                email.value.trim(),
                password.value
            );

            console.log("✅ Signup API response:", data);

            // Show success message
            if (successAlert) {
                successAlert.textContent = "Account created! Redirecting to login...";
                successAlert.style.display = "block";
                successAlert.classList.remove("d-none");
            }

            showToast("Signup successful!");

            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);

        } catch (error) {
            console.error("Signup error:", error);

            if (errorAlert) {
                errorAlert.textContent = error.message || "Signup failed";
                errorAlert.style.display = "block";
                errorAlert.classList.remove("d-none");
            }

            showToast(error.message || "Signup failed", "danger");
        }
    });
});

// Password validation
function validatePassword(password) {
    const minLength = /.{8,}/;
    const uppercase = /[A-Z]/;
    const lowercase = /[a-z]/;
    const number = /[0-9]/;
    const special = /[!@#$%^&*(),.?":{}|<>]/;
    return (
        minLength.test(password) &&
        uppercase.test(password) &&
        lowercase.test(password) &&
        number.test(password) &&
        special.test(password)
    );
}

// Toast notification
function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = "toast-popup";
    toast.style.background = type === "danger" ? "#c62828" : "var(--apple-dark)";
    toast.textContent = message;
    toast.style.position = "fixed";
    toast.style.bottom = "30px";
    toast.style.right = "30px";
    toast.style.color = "white";
    toast.style.padding = "16px 24px";
    toast.style.borderRadius = "12px";
    toast.style.boxShadow = "0 10px 40px rgba(0,0,0,0.15)";
    toast.style.zIndex = "10000";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    toast.style.transition = "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)";

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
    }, 50);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(20px)";
        setTimeout(() => toast.remove(), 400);
    }, 2500);
}