import React, { useEffect, useState } from "react";
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
      {/* Search and Export Section */}
      <div
        className="d-flex justify-content-between align-items-center"
        style={{ marginTop: "15px" }}
      >
        <h3 className="titreColore">{Title}</h3>
        <div className="d-flex">
          <div style={{ width: "500px", marginRight: "20px" }}>
            <Search onSearch={onSearch} type="search" />
          </div>
          <div>
            <FontAwesomeIcon
              style={{
                cursor: "pointer",
                color: "grey",
                fontSize: "2rem",
              }}
              onClick={printTable}
              icon={faPrint}
              className="me-2"
            />
            <FontAwesomeIcon
              style={{
                cursor: "pointer",
                color: "red",
                fontSize: "2rem",
                marginLeft: "15px",
              }}
              onClick={exportToPDF}
              icon={faFilePdf}
            />
            <FontAwesomeIcon
              icon={faFileExcel}
              onClick={exportToExcel}
              style={{
                cursor: "pointer",
                color: "green",
                fontSize: "2rem",
                marginLeft: "15px",
              }}
            />
          </div>
        </div>
      </div>
      {
          
          <div className=" bgSecteur">
          </div>

      }

      {/* Carousel and Categories Section */}
      <div style={{ height: "125px", marginTop: "-10px" }}>
        <h5 className="container-d-flex justify-content-start AjouteBotton" style={{ marginBottom: "-3px" }}>
          {subtitle}  {/* Use the passed subtitle prop here */}
        </h5>
        <div className="bgSecteur">
          <Carousel activeIndex={activeIndex} onSelect={handleSelect} interval={null}
            nextIcon={<FaArrowRight size="2x" style={{ backgroundColor: "black", borderRadius: '50%' }} />}
            prevIcon={<FaArrowLeft size="2x" style={{ backgroundColor: "black", borderRadius: '50%' }} />}
          >
            {validChunks.map((chunk, chunkIndex) => (
              <Carousel.Item key={chunkIndex}>
                <div className="d-flex justify-content-start">
                  <a href="#" style={{ marginLeft: '60px' }}>
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
  );
};

export default SearchWithExportCarousel;