/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { GamesPage } from './components/GamesPage';
import { ProfilePage } from './components/ProfilePage';

export default function App() {
  const [activeTab, setActiveTab] = useState<'GAMES' | 'PROFILE'>('GAMES');

  if (activeTab === 'PROFILE') {
    return <ProfilePage onBack={() => setActiveTab('GAMES')} />;
  }

  return <GamesPage onNavigateProfile={() => setActiveTab('PROFILE')} />;
}
