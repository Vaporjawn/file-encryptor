# 🔐 File Encryptor

A secure, enterprise-grade desktop file encryption application built with Electron and React. Encrypt and decrypt files with military-grade AES-256 encryption while maintaining an intuitive user interface.

<div align="center">

![File Encryptor](assets/icon.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Made with Electron](https://img.shields.io/badge/Made%20with-Electron-blue.svg)](https://electronjs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

</div>

## ✨ Features

### 🔒 **Enterprise-Grade Security**
- **AES-256 encryption** with secure key derivation (PBKDF2)
- **Password-based encryption** with salt-based protection
- **Secure memory handling** with automatic cleanup
- **File integrity verification** with built-in validation

### 🎯 **User Experience**
- **Drag & drop interface** for easy file selection
- **Download dialogs** - choose where to save encrypted/decrypted files
- **Batch processing** - encrypt/decrypt multiple files at once
- **Progress tracking** with real-time status updates
- **File path selection** with native system dialogs

### 🚀 **Advanced Features**
- **Resumable operations** - pause and resume large file operations
- **Worker thread processing** - non-blocking encryption for large files
- **Cloud sync integration** - secure backup and synchronization
- **File history tracking** - maintain operation logs
- **Keyboard shortcuts** - power user workflow optimization
- **Custom themes** - personalize your interface

### 🛠 **Technical Excellence**
- **Cross-platform** - Windows, macOS, and Linux support
- **TypeScript** - fully typed for better development experience
- **Modern React** with hooks and Material-UI components
- **Secure IPC** - safe communication between processes
- **Memory management** - efficient handling of large files

## 🚀 Quick Start

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/Vaporjawn/file-encryptor.git
cd file-encryptor
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm start
```

### Building for Production

**Package for your platform:**
```bash
npm run package
```

**Build all platforms:**
```bash
npm run build
```

## 📖 Usage

### Basic Encryption
1. Launch the application
2. **Drag and drop** a file or click **"Select File"**
3. Enter your **password** (use a strong password)
4. Click **"Encrypt & Download"**
5. Choose where to save your encrypted file
6. Your file is now securely encrypted with `.enc` extension

### Basic Decryption
1. Select an encrypted `.enc` file
2. Enter the **same password** used for encryption
3. Click **"Decrypt & Download"**
4. Choose where to save the decrypted file
5. Your original file is restored

### Batch Processing
- Select multiple files to encrypt/decrypt them all at once
- Choose output folder for batch operations
- Monitor progress for each file individually

## 🔧 Development

### Prerequisites
- **Node.js** 18+
- **npm** 7+
- **Git**

### Scripts
```bash
npm start          # Start development server
npm run build      # Build for production
npm run package    # Package distributable
npm run lint       # Run ESLint
npm run lint:fix   # Fix linting issues
npm test           # Run tests
```

### Project Structure
```
src/
├── main/                 # Electron main process
│   ├── crypto.ts        # Core encryption functions
│   ├── main.ts          # Main application entry
│   └── preload.ts       # Secure IPC bridge
├── renderer/            # React renderer process
│   ├── components/      # UI components
│   ├── hooks/          # Custom React hooks
│   └── utils/          # Utility functions
└── __tests__/          # Test files
```

## 🔐 Security

This application implements industry-standard security practices:

- **AES-256-GCM** encryption with authenticated encryption
- **PBKDF2** key derivation with 100,000+ iterations
- **Cryptographically secure** random salt generation
- **Memory protection** with secure buffer handling
- **No key storage** - passwords never saved to disk

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Victor Williams**
- Email: vaporjawn@gmail.com
- GitHub: [@Vaporjawn](https://github.com/Vaporjawn)

## 🙏 Acknowledgments

- Built with [Electron](https://electronjs.org/)
- UI powered by [React](https://reactjs.org/) and [Material-UI](https://mui.com/)
- Encryption powered by Node.js crypto module
- Icons from [Material Design Icons](https://mui.com/material-ui/material-icons/)

---

<div align="center">
<strong>🔐 Keep your files secure with File Encryptor! 🔐</strong>
</div>
