let userName = "";
function register() {
  const name = document.getElementById("username").value.trim();
  if (name) {
    sessionStorage.setItem("userName", name);
    userName = name;
    window.location.replace("index.html");
  } else if (!name) {
    alert("Enter a username!");
    return;
  }
}

document.getElementById("username").addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    register();
  }
});