import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTraceStore } from '@/store/trace';
import TraceFilters from './TraceFilters';
import TraceTable from './TraceTable';
import TraceDetailModal from './TraceDetailModal';
import './index.css';

export default function TracePage() {
  const [modalTraceId, setModalTraceId] = useState<string | null>(null);
  const fetchTraces = useTraceStore((s) => s.fetchTraces);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    fetchTraces();
  }, [fetchTraces]);

  useEffect(() => {
    const initialId = searchParams.get('traceId');
    if (initialId && initialId.length > 0) {
      setModalTraceId(initialId);
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <TraceFilters />
      <TraceTable onRowClick={setModalTraceId} />
      <TraceDetailModal
        key={modalTraceId}
        traceId={modalTraceId}
        open={modalTraceId !== null}
        onClose={() => setModalTraceId(null)}
      />
    </div>
  );
}
