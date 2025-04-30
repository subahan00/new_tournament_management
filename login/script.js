document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();
  
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorMsg = document.getElementById("errorMsg");
  
    // Dummy login
    if (username === "efootball" && password === "pass123") {
      alert("🎉 Login successful! Welcome to the Arena.");
      errorMsg.textContent = "";
    } else {
      errorMsg.textContent = "⚠️ Invalid credentials. Try again!";
    }
  });
  