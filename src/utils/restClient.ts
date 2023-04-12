interface RestClientParams {
	baseURL?: string;
	apiToken?: string;
	errorHandler?: (error: any) => any;
}

export const createRestClient = ({ baseURL, apiToken, errorHandler }: RestClientParams) => {
	const customFetch = async (
		method: string,
		endpoint: string,
		{ params, body, ...config } = {} as any
	) => {
		const url = new URL(endpoint, baseURL);

		if (params) {
			Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));
		}

		try {
			const response = await fetch(url.toString(), {
				method,
				headers: {
					"Content-Type": "application/json",
					authorization: `Bearer ${apiToken}`,
					...config.headers,
				},
				body: body ? JSON.stringify(body) : undefined,
				...config,
			});

			if (!response.ok) {
				let error;
				switch (response.status) {
					case 400:
						error = new Error("Bad Request");
						break;
					case 401:
						error = new Error("Unauthorized");
						break;
					case 403:
						error = new Error("Forbidden");
						break;
					case 404:
						error = new Error("Not Found");
						break;
					case 500:
						error = new Error("Internal Server Error");
						break;
					default:
						error = new Error("An error occurred while fetching the data.");
				}

				if (errorHandler) {
					return errorHandler(error);
				}

				throw error;
			}

			return response.json();
		} catch (error) {
			if (errorHandler) {
				return errorHandler(error);
			}
			throw error;
		}
	};

	return {
		fetch: customFetch,
		get: async <Response = any, Params = Record<string, string>>(
			endpoint: string,
			params?: Params,
			config?: RequestInit
		) => await customFetch("GET", endpoint, { params, ...config }),
		post: async <Response = any, Payload = Record<string, any>>(
			endpoint: string,
			payload?: Payload,
			config?: RequestInit
		) => await customFetch("POST", endpoint, { body: payload, ...config }),
		put: async <Response = any, Payload = Record<string, any>>(
			endpoint: string,
			payload?: Payload,
			config?: RequestInit
		) => await customFetch("PUT", endpoint, { body: payload, ...config }),
		delete: async <Response = any, Params = Record<string, any>>(
			endpoint: string,
			params?: Params,
			config?: RequestInit
		) => await customFetch("DELETE", endpoint, { params, ...config }),
	};
};
