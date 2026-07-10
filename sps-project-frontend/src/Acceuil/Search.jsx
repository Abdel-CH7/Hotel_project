// Search.jsx
import React, { useState } from 'react';
import { Form } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';

const Search = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch(term);
  };

  return (
    <Form className="search-form">
      <div className="position-relative search-input-wrapper">
        <Form.Control
          type="search"
          placeholder="Chercher"
          aria-label="Chercher"
          className="mr-sm-2 pr-4 search-control"
          value={searchTerm}
          onChange={handleSearch}
          style={{ borderRadius: '20px' }}
        />
        <FaSearch
          aria-hidden="true"
          className="position-absolute top-50 translate-middle-y"
          style={{ right: '10px' }}
        />
      </div>
    </Form>
  );
};

export default Search;
