<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Site Maintenance</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Poppins', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: #ffffff;
      padding: 20px;
    }

    .container {
      text-align: center;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
      border: 1px solid rgba(255, 255, 255, 0.18);
      width: 90%;
      max-width: 600px;
      margin-bottom: 60px;
    }

    .icon {
      font-size: 5rem;
      margin-bottom: 1rem;
      animation: float 3s ease-in-out infinite;
    }

    h1 {
      font-size: 2.5rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    p {
      font-size: 1.1rem;
      font-weight: 300;
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }

    .progress {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 20px;
      height: 10px;
      width: 100%;
      overflow: hidden;
    }

    .progress-bar {
      background: #4CAF50;
      height: 100%;
      width: 0%;
      animation: progress 3s ease-in-out infinite;
    }

    footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 10px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(5px);
      text-align: center;
      font-size: 0.8rem;
    }

    footer a {
      color: #FFD700;
      text-decoration: none;
      transition: color 0.3s ease;
    }

    footer a:hover {
      color: #FFA500;
    }

    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
      100% { transform: translateY(0px); }
    }

    @keyframes progress {
      0% { width: 0%; }
      50% { width: 70%; }
      100% { width: 100%; }
    }

    @media (max-width: 600px) {
      body {
        padding: 10px;
      }
      .container {
        width: 100%;
        padding: 1.5rem;
        margin-bottom: 40px;
      }
      h1 {
        font-size: 1.8rem;
      }
      p {
        font-size: 0.9rem;
      }
      .icon {
        font-size: 4rem;
      }
      footer {
        padding: 5px;
        font-size: 0.7rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🚧</div>
    <h1>We're Upgrading Our Site</h1>
    <p>We're working hard to bring you an even better experience. Please check back soon!</p>
    <div class="progress">
      <div class="progress-bar"></div>
    </div>
  </div>
  <footer>
    <p>© 2024 | Crafted by <a href="https://github.com/tony007x">Tony219y</a> & <a href="https://github.com/Gal1leo2">Gal1leo</a> | CS, KMITL</p>
  </footer>
</body>
</html>