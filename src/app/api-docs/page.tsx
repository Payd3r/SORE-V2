'use client';

import React from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { swaggerSpec } from '../../lib/swagger';

const SwaggerPage = () => {
  return <SwaggerUI spec={swaggerSpec} />;
};

export default SwaggerPage; 