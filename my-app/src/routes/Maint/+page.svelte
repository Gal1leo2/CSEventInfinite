<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Under Maintenance</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <div class="content">
      <div class="icon">🔧</div>
      <h1>We're Under Maintenance</h1>
      <p>We’re working hard to bring you a better experience. Please check back later.</p>
      <p>Estimated Time of Arrival: IDK</p>
    </div>
  </div>
  <footer class="footer">
    <div class="footer-content">
      <span>© 2024 | Made with ❤️ by <a href="https://github.com/tony007x">Tony219y</a>, <a href="https://github.com/Gal1leo2">Gal1leo</a></span>
      <span>Computer Science, King Mongkut's Institute of Technology Ladkrabang</span>
    </div>
  </footer>
</body>
</html>
<style>
    * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: Arial, sans-serif;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.container {
  flex: 1; /* Take up the remaining space */
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.content {
  text-align: center;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.icon {
  font-size: 5rem;
  color: #ff5722;
  margin-bottom: 1rem;
}

h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 1rem;
}

p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 1.5rem;
}

/* Footer Styles */
.footer {
  background-color: #f1f1f1;
  padding: 1rem 0;
  text-align: center;
  border-top: 1px solid #ddd;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.footer-content a {
  color: #ff5722;
  text-decoration: none;
}

.footer-content a:hover {
  text-decoration: underline;
}



</style>