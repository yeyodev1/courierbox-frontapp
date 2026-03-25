<script setup lang="ts">
const contactInfo = {
  email: 'ventas@courierboxlogistics.com',
  phones: ['0985099796', '0969514837'],
};

const whatsappMessage = encodeURIComponent('Hola! Me gustaría hacer una consulta.');
const whatsappUrl = `https://wa.me/593985099796?text=${whatsappMessage}`;
</script>

<template>
  <footer class="legal-footer">
    <div class="footer-container">
      
      <!-- Company Information -->
      <div class="footer-grid">
        <div class="footer-column company-info">
          <h2 class="footer-brand">COURIER BOX & APPLE STUFF S.A.S.</h2>
          <p class="ruc-number">RUC: 0993388549001</p>
          <div class="transparency-note">
            <span class="badge">S.A.S.</span>
            <p>Sociedad por Acciones Simplificada, obligada a llevar contabilidad.</p>
          </div>
          <div class="about-us">
            <h3>Sobre Nosotros</h3>
            <p>
              Dirigidos por nuestro Representante Legal, <strong>Oscar Adrian Ugarte Contreras</strong>, 
              estamos comprometidos con ofrecer un servicio logístico y tecnológico de primer nivel.
            </p>
          </div>
        </div>

        <!-- Services -->
        <div class="footer-column">
          <h3>Servicios Autorizados</h3>
          <ul class="services-list">
            <li>
              <strong>Courier:</strong> Recolección, distribución y entrega de paquetes a nivel Nacional e Internacional.
            </li>
            <li>
              <strong>Tecnología:</strong> Especialistas en venta de Apple, computadoras y equipos periféricos.
            </li>
            <li>
              <strong>Servicio Técnico:</strong> Reparación y mantenimiento experto de laptops y dispositivos móviles.
            </li>
          </ul>
        </div>

        <!-- Contact & Location -->
        <div class="footer-column">
          <h3>Contacto y Ubicación</h3>
          <div class="contact-card">
            <p class="location">
              <strong>Dirección:</strong><br/>
              Barrio El Buijo Histórico, SL-4, Manzana C<br/>
              (Frente al Club All Padel)<br/>
              Samborondón, Ecuador
            </p>
            <div class="contact-details">
              <p><strong>Email:</strong> <a :href="`mailto:${contactInfo.email}`">{{ contactInfo.email }}</a></p>
              <p><strong>Celulares:</strong> 
                <a :href="`tel:${contactInfo.phones[0]}`">{{ contactInfo.phones[0] }}</a> / 
                <a :href="`tel:${contactInfo.phones[1]}`">{{ contactInfo.phones[1] }}</a>
              </p>
            </div>
            <a :href="whatsappUrl" target="_blank" rel="noopener noreferrer" class="whatsapp-btn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.488-1.761-1.665-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              Atención vía WhatsApp
            </a>
          </div>
        </div>
      </div>

      <!-- Copyright -->
      <div class="footer-bottom">
        <p>&copy; {{ new Date().getFullYear() }} Courier Box Logistics. Todos los derechos reservados.</p>
      </div>

    </div>
  </footer>
</template>

<style lang="scss" scoped>
.legal-footer {
  background-color: $primary-dark;
  color: $text-light;
  padding: 4rem 2rem 2rem;
  font-family: $font-secondary;

  .footer-container {
    max-width: 1200px;
    margin: 0 auto;
  }
}

.footer-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;
  margin-bottom: 3rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.footer-column {
  h3 {
    font-family: $font-principal;
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    color: $primary;
    border-bottom: 1px solid rgba($primary, 0.3);
    padding-bottom: 0.5rem;
  }
}

.company-info {
  .footer-brand {
    font-family: $font-principal;
    font-size: 1.5rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
    color: $white;
  }

  .ruc-number {
    font-size: 1.1rem;
    font-weight: 600;
    color: $text-secondary;
    margin-bottom: 1.5rem;
  }

  .transparency-note {
    background-color: rgba($white, 0.05);
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: flex-start;
    gap: 1rem;

    .badge {
      background-color: $primary;
      color: $white;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 700;
      white-space: nowrap;
    }

    p {
      font-size: 0.9rem;
      line-height: 1.5;
      color: $text-secondary;
      margin: 0;
    }
  }

  .about-us {
    h3 {
      border: none;
      font-size: 1.1rem;
      margin-bottom: 0.75rem;
    }
    
    p {
      font-size: 0.95rem;
      line-height: 1.6;
      color: $text-light;
    }
  }
}

.services-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  li {
    font-size: 0.95rem;
    line-height: 1.5;
    position: relative;
    padding-left: 1.5rem;

    &::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: $secondary;
      font-weight: bold;
    }

    strong {
      color: $white;
    }
  }
}

.contact-card {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  p {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.6;
  }

  a {
    color: $white;
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: $primary;
    }
  }

  .whatsapp-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    background-color: #25D366; // Standard WhatsApp color
    color: $white;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    margin-top: 1rem;
    width: fit-content;
    transition: background-color 0.2s ease, transform 0.2s ease;

    &:hover {
      background-color: darken(#25D366, 10%);
      transform: translateY(-2px);
      color: $white; // Override general link hover
    }
  }
}

.footer-bottom {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba($text-secondary, 0.2);
  text-align: center;

  p {
    font-size: 0.9rem;
    color: $text-secondary;
    margin: 0;
  }
}
</style>
