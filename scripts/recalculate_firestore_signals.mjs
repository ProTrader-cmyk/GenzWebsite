import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { calculateTradePnl } from '../src/services/tradePnlService.js';

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
  console.log('Connecting to Firestore to review and recalculate signals...');
  const snap = await getDocs(collection(db, 'signals'));
  console.log(`Found ${snap.docs.length} signal records in Firestore.`);

  let updatedCount = 0;
  let activeCount = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const id = docSnap.id;
    const pair = (data.pair || 'XAUUSD').toUpperCase();
    const direction = (data.direction || 'BUY').toUpperCase();
    const entry = Number(data.entry ?? data.entry_price ?? data.entryPrice);
    const sl = Number(data.sl ?? data.stop_loss ?? data.stopLoss);
    const tp = Number(data.tp ?? data.take_profit ?? data.takeProfit);
    const status = String(data.status || 'active').toLowerCase();

    const isClosed = status === 'tp' || status === 'sl' || status === 'closed' || status === 'be';

    if (!isClosed) {
      console.log(`[ACTIVE] ${id} - Keeping active, ensuring 0.03 lot.`);
      await updateDoc(doc(db, 'signals', id), {
        lot: 0.03,
        lotSize: 0.03,
        lot_size: 0.03,
      });
      activeCount++;
      continue;
    }

    // Determine exit price for closed trade
    let exitPrice = Number(data.exit_price ?? data.exitPrice);
    if (!exitPrice || isNaN(exitPrice)) {
      if (status === 'tp') exitPrice = tp;
      else if (status === 'sl') exitPrice = sl;
      else if (status === 'be') exitPrice = entry;
      else exitPrice = tp || entry;
    }

    const pnlResult = calculateTradePnl({
      symbol: pair,
      direction,
      entryPrice: entry,
      exitPrice,
      lotSize: 0.03,
      stopLoss: sl,
      takeProfit: tp,
      includeCosts: false,
    });

    const updatePayload = {
      lot: 0.03,
      lotSize: 0.03,
      lot_size: 0.03,
      exit_price: exitPrice,
      exitPrice: exitPrice,
      gross_pnl: pnlResult.grossPnl,
      net_pnl: pnlResult.netPnl,
      realized_r: pnlResult.realizedR,
      recalculated_at: new Date().toISOString(),
      calculation_method: 'STANDARD_0.03_LOT_100OZ',
    };

    console.log(`[UPDATE] ${id} (${pair} ${direction})`);
    console.log(`  Entry: ${entry}, Exit: ${exitPrice}, Status: ${status}`);
    console.log(`  Recalculated Gross P/L: $${pnlResult.grossPnl}, Net P/L: $${pnlResult.netPnl}, Realized R: ${pnlResult.realizedR}R`);

    await updateDoc(doc(db, 'signals', id), updatePayload);
    updatedCount++;
  }

  console.log(`\nRecalculation Complete:`);
  console.log(`- Reviewed: ${snap.docs.length} signals`);
  console.log(`- Recalculated & Updated: ${updatedCount} closed signals`);
  console.log(`- Active signals confirmed: ${activeCount}`);
}

main().catch((err) => {
  console.error('Recalculation failed:', err);
  process.exit(1);
});
