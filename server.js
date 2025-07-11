// === IMPORTS ===
import mqtt from 'mqtt';
import admin from 'firebase-admin';
import fs from 'fs';

// === FIREBASE SETUP ===
const serviceAccount = JSON.parse(
  fs.readFileSync('serviceAccountKey.json', 'utf8') // ✅ correct path to your key
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://esp32-iot-project-75fdf-default-rtdb.firebaseio.com"
});

const db = admin.database();

// === MQTT SETUP ===
const client = mqtt.connect('mqtt://test.mosquitto.org');

// === MQTT EVENT HANDLERS ===
client.on('connect', () => {
  console.log('✅ Connected to MQTT broker');

  client.subscribe('esp32/sensor/temperature', (err) => {
    if (err) {
      console.error('❌ MQTT Subscription Error:', err);
    } else {
      console.log('📡 Subscribed to topic: esp32/sensor/temperature');
    }
  });
});

client.on('message', (topic, message) => {
  try {
    // Parse the incoming MQTT message (assumes JSON payload)
    console.log("rec ",message);
    const { temperature, humidity, timestamp } = JSON.parse(message.toString()); 
  
    // Firebase path: /iot/ESP32-1/logs/
    const ref = db.ref('iot/ESP32-15/logs');
    
    // Push a new log (auto-generated key like log-abc123)
    ref.push({
      temperature,
      humidity,
      timestamp
    });

    console.log(`📥 Logged from MQTT → Firebase: 
      Temp = ${temperature}°C, Humidity = ${humidity}%, Time = ${new Date(timestamp).toLocaleTimeString()}`);
    
  } catch (err) {
    console.error('❌ Failed to parse MQTT message or push to Firebase:', err);
  }
});

