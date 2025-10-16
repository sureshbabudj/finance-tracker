import React from 'react';
import { useParams } from 'react-router-dom';

import BankStatementAnalyzer from '@/components/BankStatementAnalyzer';

const Details: React.FC = () => {
  const { id } = useParams();
  return <BankStatementAnalyzer statementKey={id} />;
};

export default Details;
