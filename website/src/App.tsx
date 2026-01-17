import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { Home } from '@/pages/home';
import { GettingStarted } from '@/pages/getting-started';
import { Guide } from '@/pages/guide';
import { Middlewares } from '@/pages/middlewares';
import { Adapters } from '@/pages/adapters';
import { ApiReference } from '@/pages/api-reference';
import { Examples } from '@/pages/examples';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/getting-started" element={<GettingStarted />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/middlewares" element={<Middlewares />} />
        <Route path="/adapters" element={<Adapters />} />
        <Route path="/api" element={<ApiReference />} />
        <Route path="/examples" element={<Examples />} />
      </Route>
    </Routes>
  );
}
