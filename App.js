import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ImageBackground, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert, Linking, Dimensions, PanResponder, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [page, setPage] = useState('home');
  const [time, setTime] = useState("");
  const [dateString, setDateString] = useState("");
  const [ownedApps, setOwnedApps] = useState(['Messages', 'KatStore', 'Cat Catcher', 'Settings', 'YouTube', 'Maps']);
  
  // Game States
  const [currentGame, setCurrentGame] = useState(null);
  const [score, setScore] = useState(0);
  const [gamePos, setGamePos] = useState({ x: width / 2 - 30, y: height / 2 });
  const [timeLeft, setTimeLeft] = useState(1.0);

  const pan = useRef(new Animated.ValueXY()).current;

  // --- SAVE/LOAD ---
  useEffect(() => {
    const loadApps = async () => {
      try {
        const saved = await AsyncStorage.getItem('kat_apps');
        if (saved) setOwnedApps(JSON.parse(saved));
      } catch (e) { console.log("Load error"); }
    };
    loadApps();
  }, []);

  const buyApp = async (appName) => {
    if (!ownedApps.includes(appName)) {
      const updatedApps = [...ownedApps, appName];
      setOwnedApps(updatedApps);
      await AsyncStorage.setItem('kat_apps', JSON.stringify(updatedApps));
      Alert.alert("KatStore", `${appName} installed!`);
    }
  };

  // --- CLOCK & DATE ---
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDateString(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
    };
    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- CAT CATCHER ENGINE ---
  useEffect(() => {
    let engine;
    if (currentGame === 'Cat Catcher') {
      engine = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0) {
            setGamePos({ x: Math.random() * (width - 80) + 10, y: Math.random() * (height - 400) + 150 });
            return 1.0;
          }
          return prev - 0.05;
        });
      }, 50);
    }
    return () => clearInterval(engine);
  }, [currentGame]);

  const handleTap = () => {
    setScore(s => s + 1);
    setTimeLeft(1.0);
    setGamePos({ x: Math.random() * (width - 80) + 10, y: Math.random() * (height - 400) + 150 });
  };

  // --- WALLPAPER ENGINE ---
  const getWallpaper = () => {
    const now = new Date();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    if ((m === 11 && d === 25) || (m === 6 && d === 22)) return 'https://i.ibb.co/0RBWwgvK/Birthday-Cat.png';
    if (m === 1) return 'https://i.ibb.co/hRMjZHpR/January-Cat.png';
    if (m === 7) return 'https://i.ibb.co/0Ry75h2J/July-Cat.png';
    if (m === 12) return 'https://i.ibb.co/qL0rs9DW/Christmas-Cat.png';
    return 'https://i.ibb.co/ynd5BXtT/Cat-Phone-Bc.png';
  };

  const unlockPhone = () => {
    Animated.timing(pan, { toValue: { x: 0, y: -height }, duration: 300, useNativeDriver: false }).start(() => {
      setIsLocked(false);
      pan.setValue({ x: 0, y: 0 });
    });
  };

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: Animated.event([null, { dy: pan.y }], { useNativeDriver: false }),
    onPanResponderRelease: (e, gs) => {
      if (gs.dy < -100) unlockPhone();
      else Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    },
  })).current;

  if (isLocked) {
    return (
      <ImageBackground source={{ uri: getWallpaper() }} style={styles.bg}>
        <Animated.View {...panResponder.panHandlers} style={[styles.lockContainer, { transform: [{ translateY: pan.y }] }]}>
          <SafeAreaView style={styles.center}>
            <Text style={styles.lockTime}>{time}</Text>
            <Text style={styles.lockDate}>{dateString}</Text>
            <TouchableOpacity onPress={unlockPhone} style={styles.unlockArea}>
              <Text style={styles.unlockText}>▲ SWIPE UP TO UNLOCK</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </Animated.View>
      </ImageBackground>
    );
  }

  if (currentGame) {
    return (
      <View style={[styles.bg, { backgroundColor: '#000' }]}>
        <SafeAreaView style={styles.flex}>
          <View style={styles.gameHeader}>
            <Text style={styles.gameTitle}>{currentGame}</Text>
            <Text style={styles.scoreText}>Score: {score}</Text>
            <View style={styles.timerContainer}>
              <View style={[styles.timerBar, { width: `${timeLeft * 100}%` }]} />
            </View>
          </View>
          
          <TouchableOpacity onPress={handleTap} style={[styles.target, { left: gamePos.x, top: gamePos.y }]}>
            <Text style={{fontSize: 50}}>🐱</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.exitBtn} onPress={() => {setCurrentGame(null); setScore(0);}}>
            <Text style={styles.bt}>QUIT</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <ImageBackground source={{ uri: getWallpaper() }} style={styles.bg}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.sb}><Text style={styles.st}>{time}</Text><Text style={styles.st}>📶 🔋 100%</Text></View>

        {page === 'home' ? (
          <ScrollView contentContainerStyle={styles.grid}>
            <Icon n="Messages" c="#00d4ff" i="✉️" on={() => setPage('chat')} />
            <Icon n="KatStore" c="#ffd11a" i="🛍️" on={() => setPage('store')} />
            <Icon n="Cat Catcher" c="#9c27b0" i="🐱" on={() => {setCurrentGame('Cat Catcher'); setScore(0); setTimeLeft(1.0);}} />
            <Icon n="YouTube" c="#ff0000" i="📺" on={() => Linking.openURL('https://youtube.com')} />
            
            {ownedApps.includes('Roblox') && <Icon n="Roblox" c="#fff" i="🧱" on={() => Linking.openURL('roblox://')} />}
            {ownedApps.includes('Spotify') && <Icon n="Spotify" c="#1DB954" i="🎧" on={() => Linking.openURL('spotify://')} />}
            {ownedApps.includes('TikTok') && <Icon n="TikTok" c="#000" i="📱" on={() => Linking.openURL('snssdk1233://')} />}
            {ownedApps.includes('Instants') && <Icon n="Instants" c="#ff9800" i="🔊" on={() => Linking.openURL('https://www.myinstants.com')} />}
            {ownedApps.includes('Discord') && <Icon n="Discord" c="#5865F2" i="💬" on={() => Linking.openURL('https://discord.com/launch')} />}
            {ownedApps.includes('Catflix') && <Icon n="Catflix" c="#E50914" i="🐈‍⬛" on={() => Linking.openURL('https://www.youtube.com/watch?v=zzggxCKuAN8&list=PLyLhExcPns9mhcjNROplRMMmjjvuf5bFG')} />}

            <Icon n="Maps" c="#4CAF50" i="🗺️" on={() => Linking.openURL('geo:0,0?q=cats')} />
            <Icon n="Settings" c="#8e8e93" i="⚙️" on={() => Linking.openURL('package:com.android.settings')} />
          </ScrollView>
        ) : page === 'chat' ? <MessageLog setPage={setPage} /> 
          : page === 'store' ? <KatStore setPage={setPage} buyApp={buyApp} owned={ownedApps} />
          : <View />}

        <View style={styles.dock}>
          <TouchableOpacity onPress={() => setPage('chat')}><Text style={styles.di}>✉️</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setIsLocked(true)}><Text style={styles.di}>🔒</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setPage('home')}><Text style={styles.di}>🏠</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const Icon = ({ n, c, i, on }) => (
  <TouchableOpacity style={styles.ic} onPress={on}>
    <View style={[styles.pl, { backgroundColor: c }]}><Text style={{fontSize: 30}}>{i}</Text></View>
    <Text style={styles.il}>{n}</Text>
  </TouchableOpacity>
);

const MessageLog = ({ setPage }) => {
  const now = new Date();
  const month = now.getMonth(); 
  const day = now.getDate();
  let chat = [];

  // Holiday Logic with Santa and Spacekit conversation
  if (month === 11) {
    if (day === 25) {
      chat = [
        { s: "Santa", t: "Oh what's this?", c: "#ff4d4d" },
        { s: "Spacekit", t: "Happy Birthday!", c: "#00d4ff" },
        { s: "Santa", t: "You mean Christmas", c: "#ff4d4d" },
        { s: "Spacekit", t: "yeah....", c: "#00d4ff" },
        { s: "Santa", t: "Merry Christmas Anakin", c: "#ff4d4d" }
      ];
    } else if (day === 24) {
      chat = [{ s: "Santa", t: "Its Christmas Eve Ho Ho Ho!", c: "#ff4d4d" }, { s: "Spacekit", t: "I'm excited For Christmas", c: "#00d4ff" }];
    } else {
      chat = [{ s: "Santa", t: "Its beginning to look like Christmas", c: "#ff4d4d" }, { s: "Spacekit", t: "it is", c: "#00d4ff" }];
    }
  } 
  else if (month === 6) {
    chat = day === 4 ? [{ s: "Spacekit", t: "Happy 4th of July!", c: "#00d4ff" }] : [{ s: "Spacekit", t: "New year New me!", c: "#00d4ff" }];
  }
  else if (month === 5) {
    chat = [{ s: "Spacekit", t: "Its Summer TIME!!!", c: "#00d4ff" }];
  }
  else {
    chat = [
        { s: "Spacekit", t: "System Update: Discord & Settings links fixed.", c: "#00d4ff" },
        { s: "Spacekit", t: "No new messages.", c: "#00d4ff" }
    ];
  }

  const Msg = ({ s, t, c }) => (
    <View style={[styles.bubble, { borderLeftColor: c }]}>
      <Text style={{color: c, fontWeight: 'bold'}}>{s}</Text>
      <Text style={{color: 'white'}}>{t}</Text>
    </View>
  );

  return (
    <View style={styles.app}>
      <Text style={styles.title}>Space Messages</Text>
      <ScrollView>{chat.map((m, i) => <Msg key={i} s={m.s} t={m.t} c={m.c} />)}</ScrollView>
      <TouchableOpacity style={styles.btn} onPress={() => setPage('home')}><Text style={styles.bt}>HOME</Text></TouchableOpacity>
    </View>
  );
};

const KatStore = ({ setPage, buyApp, owned }) => {
  const apps = [{n:'Roblox',i:'🧱'}, {n:'Spotify',i:'🎧'}, {n:'TikTok',i:'📱'}, {n:'Instants',i:'🔊'}, {n:'Discord',i:'💬'}, {n:'Catflix',i:'🐈‍⬛'}];
  return (
    <View style={styles.app}>
      <Text style={styles.title}>KatStore 🛍️</Text>
      <ScrollView>{apps.map(a => !owned.includes(a.n) && (
        <TouchableOpacity key={a.n} style={styles.storeItem} onPress={() => buyApp(a.n)}>
          <Text style={{fontSize: 24, marginRight: 10}}>{a.i}</Text>
          <Text style={styles.bt}>{a.n}</Text>
          <Text style={{color: '#ffd11a', marginLeft: 'auto'}}>GET</Text>
        </TouchableOpacity>
      ))}</ScrollView>
      <TouchableOpacity style={styles.btn} onPress={() => setPage('home')}><Text style={styles.bt}>EXIT</Text></TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: 'black' },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lockContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', width: '100%' },
  lockTime: { fontSize: 80, color: 'white', fontWeight: '200' },
  lockDate: { fontSize: 22, color: 'white' },
  sb: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25, paddingTop: 10 },
  st: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 15 },
  ic: { width: (width - 30) / 4, alignItems: 'center', marginBottom: 25 },
  pl: { width: 62, height: 62, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  il: { color: 'white', fontSize: 11, marginTop: 5, fontWeight: '600' },
  dock: { backgroundColor: 'rgba(255, 255, 255, 0.3)', margin: 20, padding: 15, borderRadius: 35, flexDirection: 'row', justifyContent: 'space-around' },
  di: { fontSize: 32 },
  app: { flex: 1, backgroundColor: '#000', margin: 15, borderRadius: 30, padding: 20 },
  title: { color: 'white', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  bubble: { padding: 15, backgroundColor: '#151515', borderRadius: 15, marginBottom: 10, borderLeftWidth: 4 },
  storeItem: { flexDirection: 'row', backgroundColor: '#151515', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 10 },
  btn: { padding: 15, backgroundColor: '#222', borderRadius: 20, alignItems: 'center', marginTop: 10 },
  bt: { color: 'white', fontWeight: 'bold' },
  gameHeader: { marginTop: 40, alignItems: 'center' },
  gameTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  scoreText: { color: '#00d4ff', fontSize: 20 },
  timerContainer: { width: '80%', height: 10, backgroundColor: '#333', borderRadius: 5, marginTop: 10, overflow: 'hidden' },
  timerBar: { height: '100%', backgroundColor: '#00d4ff' },
  target: { position: 'absolute' },
  exitBtn: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: '#f44', padding: 15, borderRadius: 15 },
  unlockArea: { marginTop: 'auto', marginBottom: 60, padding: 20 },
  unlockText: { color: 'white', letterSpacing: 2, fontSize: 14, opacity: 0.8 },
});
