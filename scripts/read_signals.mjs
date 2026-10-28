import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAU6johl9ow1M5MPu-nJzE5yPak9EOwbuc',
  authDomain: 'genzdatabase-7f05b.firebaseapp.com',
  projectId: 'genzdatabase-7f05b',
  storageBucket: 'genzdatabase-7f05b.firebasestorage.app',
  messagingSenderId: '905323072379',
  appId: '1:905323072379:web:4ad1ef3306f6508b010bde',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const snap = await getDocs(collection(db, 'signals'));
  console.log('Total Firestore signals:', snap.docs.length);
  const records = [];
  snap.docs.forEach((doc) => {
    const data = doc.data();
    records.push({
      id: doc.id,
      pair: data.pair,
      direction: data.direction,
      entry: data.entry ?? data.entry_price ?? data.entryPrice,
      tp: data.tp ?? data.take_profit ?? data.takeProfit,
      sl: data.sl ?? data.stop_loss ?? data.stopLoss,
      exit_price: data.exit_price ?? data.exitPrice,
      status: data.status,
      net_pnl: data.net_pnl,
      gross_pnl: data.gross_pnl,
      realized_r: data.realized_r,
      lot: data.lot ?? data.lotSize ?? data.lot_size,
    });
  });
  console.log(JSON.stringify(records, null, 2));
}

main().catch(console.error);
