[
  {
    $lookup: {
      from: "six_shapes",
      let: {
        gov_inn: "$inn",
        gov_soato7_number: {
          $toLong: "$soato7"
        }
      },
      pipeline: [
        {
          $addFields: {
            org_inn_str: {
              $toString: "$organization_inn"
            }
          }
        },
        {
          $match: {
            $expr: {
              $and: [
                {
                  $eq: [
                    "$soato",
                    "$$gov_soato7_number"
                  ]
                },
                {
                  $eq: [
                    "$org_inn_str",
                    "$$gov_inn"
                  ]
                }
              ]
            }
          }
        },
        {
          $project: {
            six_shape: 1,
            total_land_area: 1,
            _id: 0
          }
        }
      ],
      as: "matched_six_shapes"
    }
  },
  {
    $unwind: {
      path: "$matched_six_shapes",
      preserveNullAndEmptyArrays: false
    }
  },
  {
    $addFields: {
      six_shape: "$matched_six_shapes.six_shape",
      total_land_area:
        "$matched_six_shapes.total_land_area"
    }
  },
  {
    $project: {
      matched_six_shapes: 0
    }
  }
]




[
  {
    $lookup: {
      from: "six_shapes",
      let: {
        gov_inn: "$inn",
        gov_soato7: {
          $toLong: "$soato7"
        }
      },
      pipeline: [
        {
          $addFields: {
            six_shape_inn: {
              $toString: "$organization_inn"
            },
            six_shape_soato: {
              $toLong: "$soato"
            }
          }
        },
        {
          $match: {
            $expr: {
              $and: [
                {
                  $eq: [
                    "$six_shape_inn",
                    "$$gov_inn"
                  ]
                },
                {
                  $eq: [
                    "$six_shape_soato",
                    "$$gov_soato7"
                  ]
                }
              ]
            }
          }
        },
        {
          $project: {
            six_shape: 1,
            total_land_area: 1,
            _id: 0
          }
        }
      ],
      as: "six_shape_info"
    }
  }
]