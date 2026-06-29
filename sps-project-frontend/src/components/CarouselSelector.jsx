import React from 'react';
import { Carousel } from 'react-bootstrap';
import { FaArrowRight, FaArrowLeft } from 'react-icons/fa';

const CarouselSelector = ({
  title,
  options,
  selectedOption,
  onSelectOption,
  activeIndex,
  onSelectIndex,
  chunkSize = 3,
}) => {
  // Fonction pour diviser les options en chunks
  const chunkArray = (array, size) => {
    const result = [];
    for (let i = 0; i < array?.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  };

  const chunks = chunkArray(options, chunkSize);

  return (
    <div>
      <h5 className="container-d-flex justify-content-start AjouteBotton" style={{ marginBottom: '3px' }}>
        {title}
      </h5>
      <div className="bgSecteur d-flex justify-content-around" style={{ height: '120px' }}>
        <Carousel
          activeIndex={activeIndex}
          onSelect={onSelectIndex}
          interval={null}
           nextIcon={<FaArrowRight size="2x" color="@ffffff" style={{backgroundColor:"black" ,borderRadius:'50%' ,marginTop:'-50px',marginRight:"5px",marginLeft:"-5px"}} />}
           prevIcon={<FaArrowLeft size="2x" color="@ffffff" style={{backgroundColor:"black" ,borderRadius:'50%',marginTop:'-50px',marginRight:"-5px",marginLeft:"5px"}} />}
      
        >
          {chunks?.map((chunk, chunkIndex) => (
            <Carousel.Item key={chunkIndex}>
              <div className="d-flex justify-content-start">
                <a href="#" style={{ marginLeft: '60px' }}>
                  <div
                    className={`category-item ${selectedOption === '' ? 'active' : ''}`}
                    onClick={() => onSelectOption('')}
                  >
                    <img
                      src={'../../images/bayd.jpg'}
                      alt={'tout'}
                      loading="lazy"
                      className={`rounded-circle category-img ${selectedOption === '' ? 'selected' : ''}`}
                    />
                    <p className="category-text">Tout</p>
                  </div>
                </a>
                {chunk?.map((option, index) => (
                  <a href="#" className="mx-5" key={index}>
                    <div
                      className={`category-item ${selectedOption === option.id ? 'active' : ''}`}
                      onClick={() => onSelectOption(option.id)}
                    >
                      <img
                        src={option.photo ? `http://127.0.0.1:8000/storage/${option.photo}` : "http://localhost:8000/storage/chambre-img.webp"}
                        alt={option.label}
                        loading="lazy"
                        className={`rounded-circle category-img ${selectedOption === option.id ? 'selected' : ''}`}
                      />
                      <p className="category-text">{option.label}</p>
                    </div>
                  </a>
                ))}
              </div>
            </Carousel.Item>
          ))}
        </Carousel>
      </div>
    </div>
  );
};

export default CarouselSelector;