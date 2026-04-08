import { Redirect } from 'expo-router';

export default function Index() {
  // මේකෙන් වෙන්නේ ඇප් එක open වෙද්දීම අපි හදපු register page එකට redirect කරන එක
  return <Redirect href="/register" />;
}