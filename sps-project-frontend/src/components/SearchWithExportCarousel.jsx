import React, { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPrint, faFilePdf, faFileExcel } from "@fortawesome/free-solid-svg-icons";
import { Carousel } from "react-bootstrap";
import Search from "../Acceuil/Search";  // Make sure you have the correct import path
import { FaArrowRight, FaArrowLeft } from "react-icons/fa";

const SearchWithExportCarousel = ({
  onSearch,
  exportToExcel,
  exportToPDF,
  printTable,
  categories,
  selectedCategory,
  handleCategoryFilterChange,
  activeIndex,
  handleSelect,
  chunks,
  subtitle,  // Add subtitle as a prop
  Title,
}) => {

  // Ensure that chunks is an array and contains data before mapping
  const validChunks = Array.isArray(chunks) && chunks.length > 0 ? chunks : [];

  useEffect(() => {
    console.log("Départements dans le carousel :", categories);
}, [categories]);


  return (
    <div>
      <div className="app-page-header">
        <h1 className="app-page-title">{Title}</h1>

        <div className="app-toolbar">
          <div className="app-search-box">
            <Search onSearch={onSearch} type="search" />
          </div>

          <div className="app-export-actions">
            <FontAwesomeIcon
              onClick={printTable}
              icon={faPrint}
              className="app-action-icon is-muted"
            />
            <FontAwesomeIcon
              onClick={exportToPDF}
              icon={faFilePdf}
              className="app-action-icon is-danger"
            />
            <FontAwesomeIcon
              icon={faFileExcel}
              onClick={exportToExcel}
              className="app-action-icon is-success"
            />
          </div>
        </div>
      </div>

      <div className="app-section">
        <div className="app-card app-filter-card">
          <h5 className="app-filter-title">{subtitle}</h5>
          <div className="bgSecteur app-filter-carousel">
          <Carousel activeIndex={activeIndex} onSelect={handleSelect} interval={null}
            nextIcon={<FaArrowRight className="app-carousel-arrow-icon" />}
            prevIcon={<FaArrowLeft className="app-carousel-arrow-icon" />}
          >
            {validChunks.map((chunk, chunkIndex) => (
              <Carousel.Item key={chunkIndex}>
                <div className="app-carousel-strip">
                  <a href="#">
                    <div
                      className={`category-item ${selectedCategory === '' ? 'active' : ''}`}
                      onClick={() => handleCategoryFilterChange("")}
                    >
                      <img
                        src={'../../images/bayd.jpg'}
                        alt={'tout'}
                        loading="lazy"
                        className={`rounded-circle category-img ${selectedCategory === '' ? 'selected' : ''}`}
                      />
                      <p className="category-text">Tout</p>
                    </div>
                  </a>

                  {chunk?.map((category, index) => (
                    <a href="#" className="mx-5" key={index}>
                      <div
                        className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
                        onClick={() => handleCategoryFilterChange(category.id)}
                      >
                        <img
                          src={category.photo ? `http://127.0.0.1:8000/storage/${category.photo}` : "http://localhost:8000/storage/chambre-img.webp"}
                          alt={category.designation}
                          loading="lazy"
                          className={`rounded-circle category-img ${selectedCategory === category.id ? 'selected' : ''}`}
                        />
                        <p className="category-text">{category.designation}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </Carousel.Item>
            ))}
          </Carousel>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchWithExportCarousel;
