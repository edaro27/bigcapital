import React, { useContext } from 'react';
import TableContext from './TableContext';

export default function TablePage() {
  const {
    table: { page },
    props: {
      spinnerProps,
      loading,
      TableRowsRenderer,
      TableLoadingRenderer,
      TableNoResultsRowRenderer,
    },
  } = useContext(TableContext);

  if (loading) {
    return (
      <TableLoadingRenderer
        spinnerProps={
          typeof spinnerProps === 'object' ? spinnerProps : undefined
        }
      />
    );
  }
  if (page.length === 0) {
    return <TableNoResultsRowRenderer />;
  }
  return <TableRowsRenderer />;
}
