// firebase/config.js
// Configuração centralizada do Firebase usando a versão Compat do SDK para facilitar a integração com Vanilla JS

const firebaseConfig = {
  apiKey: "AIzaSyC7WGuK9OG62tUPf2JwaduhCZnU5nWUtMI",
  authDomain: "crm-f2r.firebaseapp.com",
  projectId: "crm-f2r",
  storageBucket: "crm-f2r.firebasestorage.app",
  messagingSenderId: "848896586199",
  appId: "1:848896586199:web:e6cf3f3e89b68f0a831b92",
  measurementId: "G-C0QFPPJ8ZY"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Instâncias globais para Auth e Firestore
const auth = firebase.auth();
const db = firebase.firestore();

// Opcional: configurar persistência offline (opcional mas útil)
db.enablePersistence().catch((err) => {
  if (err.code == 'failed-precondition') {
      console.warn("Múltiplas abas abertas, persistência ativada apenas na primeira.");
  } else if (err.code == 'unimplemented') {
      console.warn("Navegador não suporta persistência.");
  }
});
